// Un campo de formulario con su etiqueta y su mensaje de error
export default function Field({ label, error, ...props }) {
  return (
    <label className="campo">
      {label}
      <input {...props} />
      {error && <span className="error">{error}</span>}
    </label>
  );
}
