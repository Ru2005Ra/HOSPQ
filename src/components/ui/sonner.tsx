import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      duration={3000}
      toastOptions={{
        duration: 3000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#8B4513] group-[.toaster]:text-white group-[.toaster]:border-[#6F370F] group-[.toaster]:shadow-lg",
          success:
            "!bg-[#8B4513] !text-white !border-[#6F370F]",
          info: "!bg-[#8B4513] !text-white !border-[#6F370F]",
          warning: "!bg-[#8B4513] !text-white !border-[#6F370F]",
          error: "!bg-[#8B4513] !text-white !border-[#6F370F]",
          loading: "!bg-[#8B4513] !text-white !border-[#6F370F]",
          default: "!bg-[#8B4513] !text-white !border-[#6F370F]",
          description: "group-[.toast]:text-white/80",
          actionButton: "group-[.toast]:bg-white group-[.toast]:text-[#6F370F]",
          cancelButton: "group-[.toast]:bg-white/20 group-[.toast]:text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
