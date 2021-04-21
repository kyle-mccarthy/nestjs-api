import Ajv from "ajv";
import { createContainer, Resolver } from "awilix";
import convict from "convict";
import type { AppOptions, Config, Container, Validator } from "./types";

export class App {
  public container: Container = createContainer();
  public config?: Config;
  public validator: Validator;

  private static _instance: App;

  private constructor(options?: AppOptions) {
    this.validator = new Ajv(options?.validator);
    if (options?.config) {
      this.config = convict(options.config.schema, options.config.options);
    }
  }

  public static instance(): App {
    if (!this._instance) {
      this._instance = new App();
    }
    return this._instance;
  }

  public static createApp(options?: AppOptions): App {
    if (this._instance) {
      console.warn(
        "[next-api] App.createApp called while singleton has instance"
      );
    }
    this._instance = new App(options);
    return this._instance;
  }

  public static hasInstance(): boolean {
    return !!this._instance;
  }

  public register<T>(name: string, resolver: Resolver<T>): this {
    this.container.register(name, resolver);
    return this;
  }
}
