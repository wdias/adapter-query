import { Decoder, object, string, optional, array, oneOf, constant } from '@mojotech/json-type-validation';
import { ValueType, TimeseriesType, Parameter, Location, TimeStep, parameterDecoder, locationDecoder, timeStepDecoder } from './index';

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

export type MetadataIdsQuery = {
    moduleId: string,
    valueType: ValueType,
    parameterId?: string,
    parameter?: Parameter,
    locationId?: string,
    location?: Location,
    timeseriesType: TimeseriesType,
    timeStepId?: string,
    timeStep?: TimeStep,
}
export const metadataIdsQueryDecoder: Decoder<MetadataIdsQuery> = object({
    moduleId: string(),
    valueType: oneOf(constant(ValueType.Scalar), constant(ValueType.Vector), constant(ValueType.Grid)),
    parameterId: optional(string()),
    parameter: optional(parameterDecoder),
    locationId: optional(string()),
    location: optional(locationDecoder),
    timeseriesType: oneOf(constant(TimeseriesType.ExternalHistorical), constant(TimeseriesType.ExternalForecasting), constant(TimeseriesType.SimulatedHistorical), constant(TimeseriesType.SimulatedForecasting)),
    timeStepId: optional(string()),
    timeStep: optional(timeStepDecoder),
});
