interface BackButtonProps {
  onBack: () => void;
  label?: string;
}

export default function BackButton({ onBack, label = '← Retour' }: BackButtonProps) {
  return (
    <button className="btn-back" onClick={onBack}>
      {label}
    </button>
  );
}
