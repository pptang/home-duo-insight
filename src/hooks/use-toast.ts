
// Re-export the toast components from shadcn/ui
import { useToast, toast } from "@/components/ui/use-toast"

// Extend toast with custom variants if needed
const enhancedToast = {
  ...toast,
  // You can add custom toast variants here if needed
};

export { useToast, enhancedToast as toast }
