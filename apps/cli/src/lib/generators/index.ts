import { SwaggerSchema } from "../models/SwaggerSchema";
import { generateContracts } from "./ContractGenerator";
import {
  getAngularInfrastructureTemplate,
  getInfrastructureTemplate,
} from "../renderers/InfrastructureTemplates";
import { generateServices } from "./ServiceGenerator";
import axios from "axios";
import { generateAngularServices } from "./AngularServiceGenerator";
import { render } from "../renderers/Renderer";
import { EnumType } from "../models/EnumType";

const generateContent = (
  schema: any,
  isCookiesAuthEnabled: boolean = false,
  prefixesToRemove: string[] = [],
  useStringLiteralEnums = false,
) => {
  const swaggerSchema = schema as SwaggerSchema;
  const contracts = generateContracts(swaggerSchema, useStringLiteralEnums);

  const view = {
    infrastructure: getInfrastructureTemplate(isCookiesAuthEnabled),
    contracts,
    services: generateServices(swaggerSchema, prefixesToRemove),
  };
  const content = render(
    "{{{ infrastructure }}}\n{{{ contracts }}}\n{{{ services }}}",
    view,
  );
  return content;
};

const generateAngularContent = (schema: any, prefixesToRemove: string[], useStringLiteralEnums = false) => {
  const swaggerSchema = schema as SwaggerSchema;
  const contracts = generateContracts(swaggerSchema, useStringLiteralEnums);

  const view = {
    contracts,
    infrastructure: getAngularInfrastructureTemplate(),
    services: generateAngularServices(swaggerSchema, prefixesToRemove),
  };
  const content = render(
    "{{{ infrastructure }}}\n{{{ contracts }}}\n\n{{{ services }}}\n",
    view,
  );
  return content;
};

export const generate = async (
  api: any,
  generateForAngular: boolean = false,
  isCookiesAuthEnabled: boolean = false,
  prefixesToRemove: string[] = [],
  useStringLiteralEnums = false,
) => {
  const logStep = () => console.log("⚡2/3 - Generating code");

  if (!!api.swagger && !api.openapi) {
    const response = await axios.post(
      "https://converter.swagger.io/api/convert",
      api,
    );
    if (response.status !== 200) {
      console.error("Failed to convert Swagger 2.0 to OpenAPI 3.0", response);
      return null;
    }

    logStep();
    return generateForAngular
      ? generateAngularContent(response.data, prefixesToRemove, useStringLiteralEnums)
      : generateContent(response.data, isCookiesAuthEnabled, prefixesToRemove, useStringLiteralEnums);
  }

  logStep();
  return generateForAngular
    ? generateAngularContent(api, prefixesToRemove, useStringLiteralEnums)
    : generateContent(api, isCookiesAuthEnabled, prefixesToRemove, useStringLiteralEnums);
};
