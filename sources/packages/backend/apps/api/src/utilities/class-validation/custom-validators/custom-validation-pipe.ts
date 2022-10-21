import {
  ArgumentMetadata,
  Injectable,
  ParseEnumPipe,
  ParseEnumPipeOptions,
} from "@nestjs/common";

/**
 * Custom validation pipe extended from ParseEnumPipe(Nest JS)
 * to allow nullable values and validates the only if
 * value is present.
 *
 * This validation pipe is exclusively made for
 * enum values which are supplied as either optional param or
 * query param to the API.
 */
@Injectable()
export class ParseEnumQueryPipe<T> extends ParseEnumPipe<T> {
  constructor(enumType: T, options?: ParseEnumPipeOptions) {
    super(enumType, options);
  }
  transform(value: T, metadata: ArgumentMetadata): Promise<T> {
    if (value) {
      return super.transform(value, metadata);
    }
    return undefined;
  }
}
