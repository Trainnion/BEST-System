/**
 * Field wrappers - every public form control gets a real <label>, a hint,
 * an error line and the shared .glass-input styling (44px tap target,
 * visible focus ring from globals.css).
 */

/**
 * @param {{
 *   htmlFor: string,
 *   label: string,
 *   hint?: string,
 *   error?: string,
 *   children: import('react').ReactNode,
 * }} props
 * @returns {JSX.Element}
 */
export function Field({ htmlFor, label, hint, error, children }) {
  const hintId = hint ? htmlFor + '-hint' : undefined;
  const errorId = error ? htmlFor + '-error' : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        {label}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-rose-600 dark:text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p id={hintId} className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * A labelled single line input.
 * @param {import('react').InputHTMLAttributes<HTMLInputElement> & {id: string}} props
 * @returns {JSX.Element}
 */
export function TextInput({ id, className = '', ...rest }) {
  return <input id={id} className={'glass-input ' + className} {...rest} />;
}

/**
 * A labelled multi line input.
 * @param {import('react').TextareaHTMLAttributes<HTMLTextAreaElement> & {id: string}} props
 * @returns {JSX.Element}
 */
export function TextArea({ id, className = '', ...rest }) {
  return (
    <textarea id={id} className={'glass-input min-h-[120px] resize-y ' + className} {...rest} />
  );
}

export default Field;
