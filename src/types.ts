import type {
  default as AjvValidator,
  Options as AjvOptions,
  AnySchemaObject,
  AsyncValidateFunction,
  ValidateFunction,
} from "ajv";
import type { AwilixContainer } from "awilix";
import type {
  Schema as CfgSchema,
  Options as CfgOptions,
  Config as Cfg,
} from "convict";
import type { NextApiRequest, NextApiResponse } from "next";
import type { App } from "./app";

// config: convict.Schema<T> | string, opts?: convict.Options

export type Container = AwilixContainer;
export type ValidatorOptions = AjvOptions;
export type Validator = AjvValidator;
export type ConfigOptions<T = any> = {
  schema: CfgSchema<T>;
  options?: CfgOptions;
};
export type Config<T = any> = Cfg<T>;

export type AppErrorHandler = (error: Error, ctx: Context) => Promise<void>;

export interface AppOptions<CONF = any> {
  validator?: AjvOptions;
  config?: ConfigOptions<CONF>;
  setErrorHandler?: AppErrorHandler;
}

export interface Context {
  req: NextApiRequest;
  res: NextApiResponse;
  app: App;
}

export type RequestHandler = (ctx: Context) => Promise<void>;
export type Middleware = (ctx: Context, next: () => void) => Promise<void>;

export type ValidationSchema = AnySchemaObject;

export interface RouteValidation {
  body?: ValidationSchema;
  querystring?: ValidationSchema;
  params?: ValidationSchema;
  headers?: ValidationSchema;
}

export interface RouteOptions {
  schema?: RouteValidation;
}

export type ValidationFunction<T = any> =
  | ValidateFunction<T>
  | AsyncValidateFunction<T>;

// Public methods for setting route handlers associated with the corresponding
// HTTP method
export interface RoutableMethodSetters {
  get: (h: RequestHandler, options?: RouteOptions) => this;
  post: (h: RequestHandler, options?: RouteOptions) => this;
  put: (h: RequestHandler, options?: RouteOptions) => this;
  patch: (h: RequestHandler, options?: RouteOptions) => this;
  delete: (h: RequestHandler, options?: RouteOptions) => this;
  head: (h: RequestHandler, options?: RouteOptions) => this;
  options: (h: RequestHandler, options?: RouteOptions) => this;
  trace: (h: RequestHandler, options?: RouteOptions) => this;
}

export interface Routable extends RoutableMethodSetters {
  (req: NextApiRequest, res: NextApiResponse): Promise<void>;
  use: (middleware: Middleware) => this;
}

export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
  | "TRACE";
