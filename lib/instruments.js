import { createClient } from "@/lib/supabase/server";

const INSTRUMENT_BUCKET = "instrument-documents";

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

  const supabase = await createClient();
  const { data } = await supabase.storage
    .from(INSTRUMENT_BUCKET)
    .createSignedUrl(instrument.calibration_file_path, 60 * 10);

  return {
    ...instrument,
    calibration_file_url: data?.signedUrl || null,
  };
}

export function getInstrumentFilePath(instrumentId, file) {
  if (!file || file.size === 0) {
    return null;
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "bin";
  return `${instrumentId}/calibration-${Date.now()}.${extension}`;
}
