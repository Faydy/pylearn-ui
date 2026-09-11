import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

// Select-only combobox: arrows/typeahead explore; Enter, Space or click commits.
export default function FilterDropdown({ label, value, options, onChange, disabled, compact = false, describedBy }) {
  const id = useId();
  const trigger = useRef(null);
  const popup = useRef(null);
  const typeahead = useRef({ text: '', time: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState({});
  const selected = Math.max(0, options.findIndex((option) => option.value === value));
  const activeIndex = Math.min(active, options.length - 1);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const rect = trigger.current.getBoundingClientRect();
      const width = Math.min(Math.max(rect.width, 208), window.innerWidth - 24);
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const upwards = below < 240 && above > below;
      setPosition({ width, left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)), maxHeight: Math.max(44, Math.min(280, (upwards ? above : below) - 6)),
        ...(upwards ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }) });
    };
    const outside = (event) => {
      if (!trigger.current?.contains(event.target) && !popup.current?.contains(event.target)) setOpen(false);
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    document.addEventListener('pointerdown', outside);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      document.removeEventListener('pointerdown', outside);
    };
  }, [open]);

  useEffect(() => {
    if (open) popup.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const show = () => { setActive(selected); setOpen(true); };
  const choose = (index) => { onChange(options[index].value); setOpen(false); trigger.current?.focus(); };
  const onKeyDown = (event) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault(); event.stopPropagation(); setOpen(false);
    } else if (event.key === 'Tab') {
      setOpen(false);
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (!open) show();
      else setActive(event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) choose(activeIndex);
      else show();
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      const text = (now - typeahead.current.time < 700 ? typeahead.current.text : '') + event.key.toLocaleLowerCase('ro');
      typeahead.current = { text, time: now };
      const index = options.findIndex((option) => option.label.toLocaleLowerCase('ro').startsWith(text));
      if (!open) show();
      if (index !== -1) setActive(index);
    }
  };

  return <div className="min-w-0">
    {!compact && <span id={`${id}-label`} className="mb-2 block text-xs font-medium text-muted">{label}</span>}
    <button ref={trigger} type="button" role="combobox" aria-label={compact ? `${label}: ${options[selected]?.label}` : label} aria-labelledby={compact ? undefined : `${id}-label`} aria-expanded={open} aria-haspopup="listbox" aria-controls={open ? `${id}-list` : undefined} aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined} aria-describedby={describedBy} disabled={disabled}
      onClick={() => open ? setOpen(false) : show()} onKeyDown={onKeyDown} onBlur={() => setOpen(false)}
      className={`flex min-h-11 w-full min-w-0 items-center justify-between rounded-xl py-2.5 text-text-main transition-colors hover:bg-sidebar-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${compact ? 'gap-1 border border-transparent px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm' : 'gap-2 border border-border bg-background px-3 text-sm'}`}>
      <span className="min-w-0 truncate">{compact ? <>{label}<span className="hidden text-muted xl:inline">: {options[selected]?.label}</span></> : options[selected]?.label}</span>
      <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && createPortal(<div ref={popup} id={`${id}-list`} role="listbox" aria-label={label} style={{ ...position, scrollbarWidth: 'thin', scrollbarColor: 'var(--color-border) var(--color-sidebar)' }}
      className="fixed z-50 overflow-y-auto overscroll-contain rounded-xl border border-border bg-sidebar p-1.5 text-sm text-text-main shadow-xl" onPointerDown={(event) => event.preventDefault()}>
      {options.map((option, index) => <div key={option.value} id={`${id}-option-${index}`} role="option" aria-selected={value === option.value} onClick={() => choose(index)} onPointerMove={() => setActive(index)}
        className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${activeIndex === index ? 'bg-sidebar-hover outline-1 -outline-offset-1 outline-accent/50' : ''} ${value === option.value ? 'font-semibold text-accent' : ''}`}>
        <span className="min-w-0 flex-1 break-words">{option.label}</span>{value === option.value && <Check aria-hidden="true" className="h-4 w-4 shrink-0" />}
      </div>)}
    </div>, document.body)}
  </div>;
}
