export interface FredSeriesResponse {
  observations: FredObservation[];
}

export interface FredObservation {
  date: string;
  value: string;
}