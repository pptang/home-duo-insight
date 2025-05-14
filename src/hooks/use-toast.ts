
import { Toast, toast as toastFunction } from "@/components/ui/toast"
import { useToast as useToastPrimitive } from "@/components/ui/use-toast"

export const toast = toastFunction;
export const useToast = useToastPrimitive;
