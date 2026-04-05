interface BackButtonProps {
  onBack: () => void;
  label?: string;
}

export default function BackButton({ onBack, label = '← Menu' }: BackButtonProps) {
  return (
    <button className="btn-back" onClick={onBack}>
      {label}
    </button>
  );
}
