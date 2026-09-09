// Re-export layer so components import data + helpers from one place.
export { inr } from "./store";
export {
  LAWYERS,
  PRACTICE_AREAS,
  lawyerById,
  lawyersByArea,
  TIME_SLOTS,
  nextDays,
  isSlotTaken,
  isAvailableToday,
  feeFor,
  CONSULT_LABEL,
  type Lawyer,
  type ConsultType,
  type DayOption,
} from "../data/lawyers";
