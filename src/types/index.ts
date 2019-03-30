import { Decoder, object, string, optional, number, array, oneOf, constant } from '@mojotech/json-type-validation';

// 1. ModuleId
// 2. ValueType
export enum ValueType {
  Scalar = 'Scalar',
  Vector = 'Vector',
  Grid = 'Grid',
}

// 3. Parameter
export enum ParameterType {
  Instantaneous = 'Instantaneous',
  Accumulative = 'Accumulative',
  Mean = 'Mean',
}

export type Parameter = {
  parameterId: string,
  variable: string,
  unit: string,
  parameterType: ParameterType,
}

// 4. Location
export type Location = {
  locationId: string,
  name: string,
  lat: number,
  lon: number,
  elevation?: number,
  description?: string,
}

// 5. TimeseriesType
export enum TimeseriesType {
  ExternalHistorical = 'ExternalHistorical',
  ExternalForecasting = 'ExternalForecasting',
  SimulatedHistorical = 'SimulatedHistorical',
  SimulatedForecasting = 'SimulatedForecasting',
}

// 6. TimeStep
export enum TimeStepUnit {
  Second = 'Second',
  Minute = 'Minute',
  Hour = 'Hour',
  Day = 'Day',
  Week = 'Week',
  Month = 'Month',
  Year = 'Year',
  NonEquidistant = 'NonEquidistant',
}
export type TimeStep = {
  timeStepId: string,
  unit: TimeStepUnit,
  multiplier?: number,
  divider?: number,
}

// Metadata
export type Metadata = {
  moduleId: string,
  valueType: ValueType,
  parameter: Parameter,
  location: Location,
  timeseriesType: TimeseriesType,
  timeStep: TimeStep,
}
export type MetadataIds = {
  moduleId: string,
  valueType: ValueType,
  parameterId: string,
  locationId: string,
  timeseriesType: TimeseriesType,
  timeStepId: string,
}
export const parameterDecoder: Decoder<Parameter> = object({
  parameterId: string(),
  variable: string(),
  unit: string(),
  parameterType: oneOf(constant(ParameterType.Accumulative), constant(ParameterType.Instantaneous), constant(ParameterType.Mean)),
});
export const locationDecoder: Decoder<Location> = object({
  locationId: string(),
  name: string(),
  lat: number(),
  lon: number(),
  elevation: optional(number()),
  description: optional(string()),
});
export const timeStepDecoder: Decoder<TimeStep> = object({
  timeStepId: string(),
  unit: oneOf(constant(TimeStepUnit.Second), constant(TimeStepUnit.Minute), constant(TimeStepUnit.Hour), constant(TimeStepUnit.Day), constant(TimeStepUnit.Week), constant(TimeStepUnit.Month), constant(TimeStepUnit.Year), constant(TimeStepUnit.NonEquidistant)),
  multiplier: optional(number()),
  divider: optional(number()),
})
export const metadataDecoder: Decoder<Metadata> = object({
  moduleId: string(),
  valueType: oneOf(constant(ValueType.Scalar), constant(ValueType.Vector), constant(ValueType.Grid)),
  parameter: parameterDecoder,
  location: locationDecoder,
  timeseriesType: oneOf(constant(TimeseriesType.ExternalHistorical), constant(TimeseriesType.ExternalForecasting), constant(TimeseriesType.SimulatedHistorical), constant(TimeseriesType.SimulatedForecasting)),
  timeStep: timeStepDecoder,
});
export const metadataIdsDecoder: Decoder<MetadataIds> = object({
  moduleId: string(),
  valueType: oneOf(constant(ValueType.Scalar), constant(ValueType.Vector), constant(ValueType.Grid)),
  parameterId: string(),
  locationId: string(),
  timeseriesType: oneOf(constant(TimeseriesType.ExternalHistorical), constant(TimeseriesType.ExternalForecasting), constant(TimeseriesType.SimulatedHistorical), constant(TimeseriesType.SimulatedForecasting)),
  timeStepId: string(),
});

// DataPoint
export type DataPoint = {
  time: string | number,
  value: number,
}

// TimeSeries
export type TimeSeries = {
  timeSeriesId: string,
  metadataIds: MetadataIds,
  data: DataPoint[],
}
