import { createClient } from "@/lib/supabase/server";
import { createPrivateFileUrl } from "@/lib/storage/r2";

export const INSTRUMENT_BUCKET = process.env.R2_INSTRUMENT_DOCUMENTS_BUCKET || "instrument-documents";

export async function listInstruments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("instruments")
    .select("id, name, model_number, serial_number, last_calibration_date, calibration_due_date, calibration_file_path")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return Promise.all((data || []).map(withSignedCalibrationUrl));
}

export async function getInstrument(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("instruments")
    .select("id, name, model_number, serial_number, last_calibration_date, calibration_due_date, calibration_file_path")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return withSignedCalibrationUrl(data);
}

async function withSignedCalibrationUrl(instrument) {
  if (!instrument.calibration_file_path) {
    return {
      ...instrument,
      calibration_file_url: null,
    };
  }

  return {
    ...instrument,
    calibration_file_url: await createPrivateFileUrl(INSTRUMENT_BUCKET, instrument.calibration_file_path),
  };
}

export function getInstrumentFilePath(instrumentId, file) {
  if (!file || file.size === 0) {
    return null;
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "bin";
  return `${instrumentId}/calibration-${Date.now()}.${extension}`;
}
