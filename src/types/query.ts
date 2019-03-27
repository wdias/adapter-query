import { Decoder, object, string, optional, array } from '@mojotech/json-type-validation';

export type TimeseriesQuery = {
    location?: string,
    locations?: string[],
    geoJson?: object,
    parameter?: string,
}

export const timeseriesQueryDecoder: Decoder<TimeseriesQuery> = object({
    location: optional(string()),
    locations: optional(array(string())),
    geoJson: optional(object()),
    parameter: optional(string()),
});
