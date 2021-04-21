import { App } from "./app";
import { router } from "./router";
import { Routable, AppOptions } from "./types";

export * from "./types";
export { asClass, asFunction, asValue } from "awilix";

export interface Boot {
  getApp: () => App;
  router: () => Routable;
}

function getApp(): App {
  return App.instance();
}

// factory function for bootstrapping the application and getting access to the
// router and getApp function
export function factory(
  bootstrap?: (app: App) => void,
  options?: AppOptions
): Boot {
  if (!App.hasInstance()) {
    App.createApp(options);

    if (typeof bootstrap === "function") {
      bootstrap(App.instance());
    }
  }

  return {
    getApp,
    router,
  };
}
