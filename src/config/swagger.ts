import swaggerJSDoc from "swagger-jsdoc";

const isProduction = process.env.NODE_ENV === "production";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Leaderboard API",
      version: "1.0.0",
      description: "Leaderboard API documentation",
    },
    servers: [
      {
        url: "http://localhost:8000",
      },
    ],
  },
  apis: isProduction
    ? ["./dist/routes/*.js", "./dist/controllers/*.js"]
    : ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
