import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

export const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'rgba(22, 22, 22, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          color: '#fff',
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          fontSize: '13px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
        },
        classNames: {
          title: 'text-white font-semibold',
          description: 'text-[#a3a3a3]',
          actionButton: 'bg-[#F3E700] text-black',
          cancelButton: 'bg-[#2a2a2a] text-white',
          success: 'border-[rgba(16,185,129,0.35)]',
          error: 'border-[rgba(239,68,68,0.35)]',
          warning: 'border-[rgba(245,158,11,0.35)]',
          info: 'border-[rgba(243,231,0,0.35)]',
        },
      }}
      {...props}
    />
  );
};
