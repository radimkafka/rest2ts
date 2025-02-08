import { render } from "../renderers/Renderer";
import { SwaggerSchema } from "../models/SwaggerSchema";
import { renderProperties, sanitizeTypeName } from "./Common";
import { EnumType } from "../models/EnumType";

export const generateContracts = (swaggerSchema: SwaggerSchema, enumType: EnumType = "enum") => {
  const rp = renderProperties(swaggerSchema);

  const rows = Object.keys(swaggerSchema.components?.schemas || [])
    .map(k => {
      const o = swaggerSchema.components.schemas[k]!;
      const sanitizedName = sanitizeTypeName(k);

      if (o.enum) {
        const view = {
          name: sanitizedName,
          properties: rp(o, true, enumType),
        };
        return render(
          `export enum {{ name }} {\n\t{{{ properties }}}\n};\n`,
          view,
        );
      }

      const view = {
        name: sanitizedName,
        properties: rp(o, false),
      };

      if (o.type === "object") {
        return view.properties.length > 0 && view.properties !== "unknown"
          ? render(
              `export type {{ name }} = {\n\t{{{ properties }}}\n};\n`,
              view,
            )
          : render(`export type {{ name }} = {};\n`, view);
      }

      return render(`export const {{ name }} = {{{ properties }}};\n`, view);
    })
    .join("\n");

  return render("{{{ rows }}}", { rows });
};
