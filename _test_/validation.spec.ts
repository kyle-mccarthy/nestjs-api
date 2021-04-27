import { testApiHandler } from "next-test-api-route-handler";
import factory from "./../src";

describe("runs validation for routes", () => {
  const { router } = factory();

  const INVALID_POST_DATA = { foo: "non-numeric-value", bar: "abc" };
  const VALID_POST_DATA = { foo: 123, bar: "abc" };

  const BODY_SCHEMA = {
    type: "object",
    required: ["foo", "bar"],
    properties: {
      foo: { type: "integer" },
      bar: { type: "string" },
    },
  };

  test("invalid body fails validation", async (done) => {
    const handler = router().post(
      async (ctx) => {
        ctx.res.json({ message: "ok" });
      },
      {
        schema: {
          body: BODY_SCHEMA,
        },
      }
    );

    // test body failing validation
    testApiHandler({
      requestPatcher: (req) => (req.url = "/api/test-post-validation"),
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(INVALID_POST_DATA),
        });

        const body = await res.json();

        expect(res.status).toEqual(400);
        expect(body.statusCode).toEqual(400);
        expect(body.message).toEqual("Bad Request");
        expect(body.error).toEqual("Bad Request");
        expect(body.details).toEqual([
          {
            instancePath: "/foo",
            schemaPath: "#/properties/foo/type",
            keyword: "type",
            params: {
              type: "integer",
            },
            message: "must be integer",
          },
        ]);

        done();
      },
    });
  });

  test("valid body passes validation", async (done) => {
    const handler = router().post(
      async (ctx) => {
        ctx.res.json({ message: "ok" });
      },
      {
        schema: {
          body: BODY_SCHEMA,
        },
      }
    );

    // test body failing validation
    testApiHandler({
      requestPatcher: (req) => (req.url = "/api/test-post-validation"),
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(VALID_POST_DATA),
        });

        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body).toEqual({ message: "ok" });

        done();
      },
    });
  });
});
