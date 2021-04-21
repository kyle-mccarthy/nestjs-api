import Boom from "@hapi/boom";
import assert from "assert";
import type { NextApiRequest, NextApiResponse } from "next";
import type {
  HTTPMethod,
  RequestHandler,
  RouteOptions,
  Routable,
  Context,
} from "./types";
import { App } from "./app";

class Route {
  constructor(
    public method: HTTPMethod,
    public handler: RequestHandler,
    public options?: RouteOptions
  ) {}

  async run(ctx: Context): Promise<void> {
    await this.handler(ctx);
    return;
  }
}

// Properties that are private/protected but available on the Routable object
interface RoutableInternals {
  allowedMethods: HTTPMethod[];
  runLifeCycle: RequestHandler;
  routes: Partial<Record<HTTPMethod, Route>>;
  defaultRoute?: RequestHandler;
  all: (h: RequestHandler) => this;
}

function routeExists(route: any): route is Route {
  return (
    typeof route === "object" &&
    route?.method === "string" &&
    route?.handler === "function"
  );
}

export const router = (): Routable => {
  const self = async function (
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<void> {
    const app = App.instance();
    const ctx = { req, res, app };
    self.runLifeCycle(ctx);
  } as Routable & RoutableInternals;

  self.routes = {};

  self.runLifeCycle = async (ctx: Context): Promise<void> => {
    const method = ctx.req.method as HTTPMethod;

    let err: Error | null = null;

    // TODO error handling on middleware confirm the signature too
    // if (self.middleware) {
    //   await new Promise<void>((resolve, reject) => {
    //     self.middleware.run((err, req, res) => {
    //       if (err) {
    //         return reject(err);
    //       }
    //       return resolve();
    //     });
    //   });
    // }

    // Attempt to find the correct handler based on the HTTP method. The
    // following cases are handled in the specified order:
    // 1. Handler exists for the request's HTTP method, run it
    // 2. The request is a HEAD request, a handler doesn't exist for HEAD, but
    //    does exists for GET, run that
    // 3. The handler doesn't exist for the request's HTTP method, but an "all"
    //    handler exists, run the all handler
    // 4. No appropriate handlers exist, throw a 404 error
    try {
      const route = self.routes[method];
      if (routeExists(route)) {
        await route.run(ctx);
      } else if (method === "HEAD" && self.routes.GET) {
        await self.routes.GET.run(ctx);
      } else if (self.defaultRoute) {
        await self.defaultRoute(ctx);
      } else {
        throw Boom.notFound();
      }
    } catch (e) {
      err = e;
    }

    // the route handler threw an exception, handle it and send response
    if (err) {
      if (!Boom.isBoom(err)) {
        err = Boom.boomify(err);
      }

      // required -- TS doesn't properly narrow the type without it
      assert(Boom.isBoom(err));

      Object.entries(err.output.headers).forEach(([key, value]) => {
        if (typeof value === "string") {
          ctx.res.setHeader(key, value);
        }
      });

      return ctx.res.status(err.output.statusCode).json(err.output.payload);
    }
  };

  // track the "allowed"/defined methods for the route, helps to set the Allow
  // header when a route isn't defined for a particular HTTP method
  self.allowedMethods = [];

  function defineRouteSetter(method: HTTPMethod) {
    return function (handler: RequestHandler, options?: RouteOptions) {
      self.routes[method] = new Route(method, handler, options);
      self.allowedMethods.push(method);
      return self;
    };
  }

  self.get = defineRouteSetter("GET");
  self.post = defineRouteSetter("POST");
  self.put = defineRouteSetter("PUT");
  self.patch = defineRouteSetter("PATCH");
  self.delete = defineRouteSetter("DELETE");
  self.options = defineRouteSetter("OPTIONS");
  self.head = defineRouteSetter("HEAD");
  self.trace = defineRouteSetter("TRACE");

  self.all = function (h: RequestHandler) {
    self.defaultRoute = h;
    return self;
  };

  // self.use = function (middleware: Middleware) {
  //   if (self.middleware === null) {
  //     self.middleware = new Middie();
  //   }

  //   self.middleware.use(middleware);
  // }.bind(self);

  return self;
};
