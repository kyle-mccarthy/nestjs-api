import Ajv from "ajv";
import ajvErrors from "ajv-errors";
import { createContainer, Resolver } from "awilix";
import convict from "convict";
import type { AppOptions, Config, Container, Validator } from "./types";
import assert from "assert";

export class App {
  public container: Container = createContainer();
  public config?: Config;
  public validator: Validator;

  private static _instance: App;

  private constructor(options?: AppOptions) {
    const validatorOptions = options?.validator || {
      coerceTypes: true,
    };

    this.validator = new Ajv({ ...validatorOptions, allErrors: true });
    ajvErrors(this.validator);

    if (options?.config) {
      this.config = convict(options.config.schema, options.config.options);
    }
  }

  public static instance(): App {
    assert(
      this._instance,
      "[next-api] app not property initialized, create app instance using App.createApp"
    );
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
