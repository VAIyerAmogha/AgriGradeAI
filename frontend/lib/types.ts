export interface GradeResponse {
  produce_name: string;
  confidence: number;
  defect_percentage: number;
  color_score: number;
  texture_score: number;
  shape_score: number;
  grade: "A" | "B" | "C" | "REJECT";
  reason: string;
  uncertain: boolean;
}

export interface PriceRecord {
  market: string;
  date: string;
  min_price: string;
  modal_price: string;
  max_price: string;
}

export interface PriceResponse {
  commodity: string;
  state: string;
  records: PriceRecord[];
  grade_A_estimate: string;
  grade_B_estimate: string;
  grade_C_estimate: string;
}

export interface UploadHistoryEntry {
  id: string;
  timestamp: string;
  source: "upload" | "price";
  fileName: string;
  produceName: string;
  grade: GradeResponse["grade"];
  confidence: number;
  defectPercentage: number;
  reason: string;
  price?: PriceResponse;
}
