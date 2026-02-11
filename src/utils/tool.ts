import { Tool } from '@modelcontextprotocol/sdk/types.js'
import { ZodSchema } from 'zod'

type JsonSchema = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Custom Zod to JSON Schema converter for Zod 4.x compatibility
 * This is a simplified converter that handles the common patterns used in our tool schemas
 */
function convertZodToJsonSchema(schema: ZodSchema): JsonSchema {
  const def = (schema as any)._def // eslint-disable-line @typescript-eslint/no-explicit-any

  // Handle ZodObject (z.object({...}))
  if (def.type === 'object') {
    const properties: Record<string, any> = {} // eslint-disable-line @typescript-eslint/no-explicit-any
    const required: string[] = []
    const shape = def.shape

    for (const [key, fieldSchema] of Object.entries(shape)) {
      const fieldDef = (fieldSchema as any).def // eslint-disable-line @typescript-eslint/no-explicit-any
      properties[key] = convertFieldToJsonSchema(fieldSchema as ZodSchema)

      // Check if field is optional
      if (fieldDef.type !== 'optional' && fieldDef.type !== 'nullable') {
        required.push(key)
      }
    }

    return {
      type: 'object',
      properties,
      required,
      additionalProperties: false,
    }
  }

  // Fallback for non-object schemas (shouldn't happen for tool schemas)
  return { type: 'object', properties: {}, required: [] }
}

/**
 * Convert a Zod field schema to JSON Schema
 */
function convertFieldToJsonSchema(fieldSchema: ZodSchema): JsonSchema {
  const field = fieldSchema as any // eslint-disable-line @typescript-eslint/no-explicit-any
  // In Zod 4.x, both _def and def exist and are the same
  const def = field._def || field.def || {}

  if (!def.type) {
    // Fallback for unknown types
    return { type: 'string' }
  }

  const type = def.type

  // Handle optional/nullable wrappers
  if (type === 'optional' || type === 'nullable') {
    const inner = def.innerType
    if (inner) {
      const innerSchema = convertFieldToJsonSchema(inner)
      // For optional fields, we don't add them to required array (handled above)
      return innerSchema
    }
    return { type: 'string' }
  }

  // Handle default wrappers
  if (type === 'default') {
    const inner = def.innerType
    if (inner) {
      const innerSchema = convertFieldToJsonSchema(inner)
      // defaultValue can be either a function or a direct value
      innerSchema.default =
        typeof def.defaultValue === 'function'
          ? def.defaultValue()
          : def.defaultValue
      return innerSchema
    }
    return { type: 'string' }
  }

  // Handle arrays - use element property for Zod 4.x
  if (type === 'array') {
    const element = def.element || field.element
    if (element) {
      const itemsSchema = convertFieldToJsonSchema(element)
      return {
        type: 'array',
        items: itemsSchema,
      }
    }
    return { type: 'array', items: {} }
  }

  // Handle enums
  if (type === 'enum') {
    return {
      type: 'string',
      enum: def.values || [],
    }
  }

  // Handle literals
  if (type === 'literal') {
    return {
      type: typeof def.value,
      const: def.value,
    }
  }

  // Handle basic types
  const typeMapping: Record<string, string> = {
    string: 'string',
    number: 'number',
    integer: 'integer',
    boolean: 'boolean',
  }

  const jsonType = typeMapping[type] || 'string'
  const result: JsonSchema = { type: jsonType }

  // In Zod 4.x, constraints are directly on the field object
  if (type === 'string') {
    if (field.minLength != null && field.minLength > 0)
      result.minLength = field.minLength
    if (field.maxLength != null) result.maxLength = field.maxLength
    if (field.format) result.format = field.format
  }

  if (type === 'number' || type === 'integer') {
    if (field.minValue != null) result.minimum = field.minValue
    if (field.maxValue != null) result.maximum = field.maxValue
  }

  // Extract description from the def
  if (def.description) {
    result.description = def.description
  }

  return result
}

/**
 * Creates a tool definition object using the provided Zod schema.
 *
 * This function converts a Zod schema (acting as the single source of truth) into a JSON Schema,
 * extracts the relevant root object properties, and embeds them into the tool definition.
 * This approach avoids duplicate schema definitions and ensures type safety and consistency.
 *
 * Note: The provided name is also used as the tool's name in the Model Context Protocol.
 *
 * @param schema - The Zod schema representing the tool's parameters.
 * @param name - The name of the tool and the key used to extract the corresponding schema definition, and the tool's name in the Model Context Protocol.
 * @param description - A brief description of the tool's functionality.
 * @returns A tool object containing the name, description, and input JSON Schema.
 */
export function createToolSchema<T extends string>(
  schema: ZodSchema<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  name: T,
  description: string,
): Tool & { name: T } {
  // Use custom converter for Zod 4.x compatibility
  const inputSchema = convertZodToJsonSchema(schema)

  return {
    name,
    description,
    inputSchema,
  }
}
