/* @ds-bundle: {"format":4,"namespace":"NextRaiseDesignSystem_94a86a","components":[{"name":"Accordion","sourcePath":"components/core/Accordion.jsx"},{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Chip","sourcePath":"components/core/Chip.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"ProgressBar","sourcePath":"components/core/ProgressBar.jsx"},{"name":"ScoreRing","sourcePath":"components/core/ScoreRing.jsx"},{"name":"Select","sourcePath":"components/core/Select.jsx"},{"name":"StatBlock","sourcePath":"components/core/StatBlock.jsx"},{"name":"Wordmark","sourcePath":"components/core/Wordmark.jsx"},{"name":"AnnouncementBar","sourcePath":"components/patterns/AnnouncementBar.jsx"},{"name":"AtsScoreCard","sourcePath":"components/patterns/AtsScoreCard.jsx"},{"name":"AutofillPanel","sourcePath":"components/patterns/AutofillPanel.jsx"},{"name":"JobFilterBar","sourcePath":"components/patterns/JobFilterBar.jsx"},{"name":"JobMatchCard","sourcePath":"components/patterns/JobMatchCard.jsx"},{"name":"LogoMarquee","sourcePath":"components/patterns/LogoMarquee.jsx"},{"name":"ReferralRow","sourcePath":"components/patterns/ReferralRow.jsx"},{"name":"SiteFooter","sourcePath":"components/patterns/SiteFooter.jsx"},{"name":"SiteNav","sourcePath":"components/patterns/SiteNav.jsx"},{"name":"TailoredResumeCard","sourcePath":"components/patterns/TailoredResumeCard.jsx"},{"name":"TestimonialCard","sourcePath":"components/patterns/TestimonialCard.jsx"}],"sourceHashes":{"components/core/Accordion.jsx":"731808cbe053","components/core/Avatar.jsx":"60c9e70053c7","components/core/Badge.jsx":"92a8f71490e0","components/core/Button.jsx":"9c15564aef9d","components/core/Card.jsx":"fbe8605f1fce","components/core/Chip.jsx":"0c6ab6e52701","components/core/Icon.jsx":"74de747d50fc","components/core/Input.jsx":"bb805200fe89","components/core/ProgressBar.jsx":"9bee8732c632","components/core/ScoreRing.jsx":"b4347a10db1a","components/core/Select.jsx":"c00e618a6dbd","components/core/StatBlock.jsx":"b544def87509","components/core/Wordmark.jsx":"f8f5adb24c5f","components/patterns/AnnouncementBar.jsx":"f83d43696b8b","components/patterns/AtsScoreCard.jsx":"b27ae0b94172","components/patterns/AutofillPanel.jsx":"ebb772cdc4bb","components/patterns/JobFilterBar.jsx":"a5106c3f966e","components/patterns/JobMatchCard.jsx":"815f6f800668","components/patterns/LogoMarquee.jsx":"bc182a04bc64","components/patterns/ReferralRow.jsx":"cbef2a22cf72","components/patterns/SiteFooter.jsx":"1a18f0154021","components/patterns/SiteNav.jsx":"014c8e4bade2","components/patterns/TailoredResumeCard.jsx":"79e7a2ce6310","components/patterns/TestimonialCard.jsx":"111791c23543","ui_kits/extension/AutofillFlow.jsx":"5b6c2993d9ed","ui_kits/extension/ResumePanel.jsx":"98a686e100f5","ui_kits/extension/ScoreOverlay.jsx":"f2c270571d88","ui_kits/website/Home.jsx":"e5d2413007fe","ui_kits/website/JobsPage.jsx":"8eb6afff8f4a","ui_kits/website/PricingPage.jsx":"0a6345909de2"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.NextRaiseDesignSystem_94a86a = window.NextRaiseDesignSystem_94a86a || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Avatar({
  src,
  name = '',
  size = 40,
  verified = false,
  style,
  ...rest
}) {
  const initial = name.trim().charAt(0).toUpperCase();
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: 'relative',
      display: 'inline-flex',
      flex: '0 0 auto',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: 'var(--radius-circle)',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: src ? 'var(--surface-inset)' : 'var(--brand-100)',
      color: 'var(--brand-700)',
      font: 'var(--type-ui)',
      fontSize: Math.round(size * 0.42),
      fontWeight: 'var(--weight-bold)',
      boxShadow: 'var(--ring-inset)'
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initial), verified && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: Math.max(14, size * 0.34),
      height: Math.max(14, size * 0.34),
      borderRadius: 'var(--radius-circle)',
      background: 'var(--sky-500)',
      border: '2px solid var(--surface-page)'
    }
  }));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  children,
  padding = 'var(--pad-card)',
  tone = 'default',
  hoverable = false,
  style,
  ...rest
}) {
  const tones = {
    default: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)'
    },
    muted: {
      background: 'var(--surface-muted)',
      border: '1px solid var(--border-subtle)'
    },
    brand: {
      background: 'var(--surface-brand-soft)',
      border: '1px solid var(--brand-200)'
    },
    success: {
      background: 'var(--surface-success-soft)',
      border: '1px solid var(--success-200)'
    },
    dark: {
      background: 'var(--surface-dark)',
      border: '1px solid rgba(255,255,255,.08)',
      color: 'var(--neutral-0)'
    }
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      borderRadius: 'var(--radius-card)',
      padding,
      boxShadow: 'var(--elevation-card)',
      transition: 'var(--transition-surface)',
      ...tones[tone],
      ...style
    },
    onMouseEnter: e => {
      if (hoverable) {
        e.currentTarget.style.boxShadow = 'var(--elevation-card-hover)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }
    },
    onMouseLeave: e => {
      if (hoverable) {
        e.currentTarget.style.boxShadow = 'var(--elevation-card)';
        e.currentTarget.style.transform = 'none';
      }
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Lucide (24px, 2px stroke) rendered as a CSS mask so it inherits currentColor.
// NOTE: NextRaise ships no icon binaries in this design system — Lucide is a
// flagged substitution matched on stroke weight. See readme.md > ICONOGRAPHY.
const CDN = 'https://unpkg.com/lucide-static@0.544.0/icons/';
function Icon({
  name,
  size = 18,
  strokeAlias,
  style,
  ...rest
}) {
  const url = `url("${CDN}${name}.svg")`;
  return /*#__PURE__*/React.createElement("span", _extends({
    "aria-hidden": "true",
    "data-icon": name,
    style: {
      display: 'inline-block',
      width: size,
      height: size,
      flex: '0 0 auto',
      backgroundColor: 'currentColor',
      WebkitMaskImage: url,
      maskImage: url,
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Accordion.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
function Accordion({
  items = [],
  defaultOpen = -1,
  style,
  ...rest
}) {
  const [open, setOpen] = useState(defaultOpen);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      ...style
    }
  }, rest), items.map((it, i) => {
    const isOpen = open === i;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setOpen(isOpen ? -1 : i),
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        width: '100%',
        padding: '20px 0',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        font: 'var(--font-sans)',
        fontSize: 'var(--text-h4)',
        fontWeight: 'var(--weight-semibold)',
        color: 'var(--text-heading)',
        textAlign: 'left',
        transition: 'var(--transition-control)'
      }
    }, it.question, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-muted)',
        display: 'flex',
        transform: isOpen ? 'rotate(180deg)' : 'none',
        transition: 'transform var(--duration-base) var(--ease-standard)'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "chevron-down",
      size: 18
    }))), isOpen && /*#__PURE__*/React.createElement("p", {
      style: {
        margin: '0 0 20px',
        maxWidth: 640,
        font: 'var(--type-body)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-muted)',
        textWrap: 'pretty'
      }
    }, it.answer));
  }));
}
Object.assign(__ds_scope, { Accordion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Accordion.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  brand: {
    background: 'var(--surface-brand-soft)',
    color: 'var(--text-brand)'
  },
  solid: {
    background: 'var(--surface-brand)',
    color: 'var(--text-on-brand)'
  },
  ink: {
    background: 'var(--surface-dark)',
    color: 'var(--neutral-0)'
  },
  success: {
    background: 'var(--surface-success-soft)',
    color: 'var(--text-success)'
  },
  neutral: {
    background: 'var(--surface-inset)',
    color: 'var(--text-muted)'
  },
  warning: {
    background: 'var(--amber-100)',
    color: 'var(--amber-700)'
  },
  danger: {
    background: 'var(--red-100)',
    color: 'var(--red-700)'
  },
  info: {
    background: 'var(--blue-100)',
    color: 'var(--blue-700)'
  },
  live: {
    background: 'var(--neutral-0)',
    color: 'var(--text-success)'
  }
};
function Badge({
  children,
  tone = 'brand',
  icon,
  dot = false,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.brand;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 24,
      padding: '0 10px',
      borderRadius: 'var(--radius-chip)',
      font: 'var(--type-meta)',
      fontWeight: 'var(--weight-semibold)',
      border: tone === 'live' ? '1px solid var(--border-subtle)' : '1px solid transparent',
      ...t,
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 'var(--radius-circle)',
      background: 'currentColor'
    }
  }), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 13
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// v2: ink primary + accent blue + caps (recompile touch)

const SIZES = {
  sm: {
    height: 34,
    padding: '0 14px',
    font: 'var(--text-xs)',
    icon: 14
  },
  md: {
    height: 44,
    padding: '0 22px',
    font: 'var(--text-sm)',
    icon: 16
  },
  lg: {
    height: 60,
    padding: '0 34px',
    font: 'var(--text-md)',
    icon: 18
  }
};
const VARIANTS = {
  primary: {
    background: 'var(--surface-cta)',
    color: 'var(--neutral-0)',
    border: '1px solid transparent',
    boxShadow: 'var(--shadow-cta)'
  },
  accent: {
    background: 'var(--surface-brand)',
    color: 'var(--text-on-brand)',
    border: '1px solid transparent',
    boxShadow: 'var(--shadow-brand)'
  },
  secondary: {
    background: 'var(--surface-card)',
    color: 'var(--text-heading)',
    border: '1px solid var(--border-default)',
    boxShadow: 'var(--shadow-xs)'
  },
  soft: {
    background: 'var(--surface-brand-soft)',
    color: 'var(--text-brand)',
    border: '1px solid transparent',
    boxShadow: 'none'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-body)',
    border: '1px solid transparent',
    boxShadow: 'none'
  },
  success: {
    background: 'var(--success-500)',
    color: 'var(--neutral-0)',
    border: '1px solid transparent',
    boxShadow: 'none'
  }
};
function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconAfter,
  caps = false,
  block = false,
  disabled = false,
  as = 'button',
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    disabled: Tag === 'button' ? disabled : undefined,
    style: {
      display: block ? 'flex' : 'inline-flex',
      width: block ? '100%' : undefined,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--gap-inline)',
      height: s.height,
      padding: s.padding,
      borderRadius: 'var(--radius-button)',
      font: 'var(--type-ui)',
      fontSize: s.font,
      fontWeight: 'var(--weight-bold)',
      letterSpacing: caps ? '0.04em' : '-0.01em',
      textTransform: caps ? 'uppercase' : 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      textDecoration: 'none',
      whiteSpace: 'nowrap',
      transition: 'var(--transition-control)',
      ...v,
      ...style
    },
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = 'scale(var(--press-scale))';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = 'none';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'none';
    }
  }, rest), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.icon
  }), children, iconAfter && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconAfter,
    size: s.icon
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Chip({
  children,
  selected = false,
  count,
  icon,
  onClick,
  style,
  ...rest
}) {
  const interactive = typeof onClick === 'function';
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 32,
      padding: '0 12px',
      borderRadius: 'var(--radius-chip)',
      border: selected ? '1px solid var(--border-brand)' : '1px solid var(--border-subtle)',
      background: selected ? 'var(--surface-brand-soft)' : 'var(--surface-card)',
      color: selected ? 'var(--text-brand)' : 'var(--text-body)',
      font: 'var(--type-meta)',
      fontWeight: 'var(--weight-medium)',
      cursor: interactive ? 'pointer' : 'default',
      transition: 'var(--transition-control)',
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 13
  }), children, count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-subtle)'
    }
  }, count));
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Chip.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
function Input({
  label,
  icon,
  hint,
  error,
  value,
  onChange,
  placeholder,
  type = 'text',
  style,
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 46,
      padding: '0 14px',
      borderRadius: 'var(--radius-input)',
      background: 'var(--surface-card)',
      border: `1px solid ${error ? 'var(--red-500)' : focus ? 'var(--border-focus)' : 'var(--border-subtle)'}`,
      boxShadow: focus ? 'var(--ring-focus)' : 'none',
      transition: 'var(--transition-control)',
      color: 'var(--text-subtle)'
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16
  }), /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: 'var(--type-body)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-heading)'
    }
  }, rest))), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: error ? 'var(--text-danger)' : 'var(--text-subtle)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ProgressBar({
  value = 0,
  label,
  caption,
  height = 6,
  tone,
  style,
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value));
  const colour = tone || (pct >= 80 ? 'var(--score-strong)' : pct >= 50 ? 'var(--score-mid)' : 'var(--score-weak)');
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, rest), (label || caption) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12,
      font: 'var(--type-meta)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-body)',
      fontWeight: 'var(--weight-semibold)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-subtle)'
    }
  }, caption)), /*#__PURE__*/React.createElement("div", {
    style: {
      height,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--score-track)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: pct + '%',
      height: '100%',
      borderRadius: 'var(--radius-pill)',
      background: colour,
      transition: 'var(--transition-score)'
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/core/ScoreRing.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ScoreRing({
  value = 0,
  size = 88,
  thickness = 8,
  label,
  tone,
  onDark = false,
  style,
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value));
  const colour = tone || (pct >= 80 ? 'var(--score-strong)' : pct >= 50 ? 'var(--score-mid)' : 'var(--score-weak)');
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      transform: 'rotate(-90deg)'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: onDark ? 'var(--score-track-dark)' : 'var(--score-track)',
    strokeWidth: thickness
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: colour,
    strokeWidth: thickness,
    strokeLinecap: "round",
    strokeDasharray: c,
    strokeDashoffset: c * (1 - pct / 100),
    style: {
      transition: 'var(--transition-score)'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      font: 'var(--font-sans)',
      fontSize: Math.round(size * 0.3),
      fontWeight: 'var(--weight-extrabold)',
      letterSpacing: 'var(--tracking-heading)',
      color: onDark ? 'var(--neutral-0)' : 'var(--text-heading)'
    }
  }, pct)), label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: onDark ? 'rgba(255,255,255,.62)' : 'var(--text-muted)'
    }
  }, label));
}
Object.assign(__ds_scope, { ScoreRing });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ScoreRing.jsx", error: String((e && e.message) || e) }); }

// components/core/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  label,
  options = [],
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    value: value,
    onChange: onChange,
    style: {
      appearance: 'none',
      width: '100%',
      height: 46,
      padding: '0 38px 0 14px',
      borderRadius: 'var(--radius-input)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      font: 'var(--type-body)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-heading)',
      cursor: 'pointer',
      transition: 'var(--transition-control)'
    }
  }, rest), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: typeof o === 'string' ? o : o.value,
    value: typeof o === 'string' ? o : o.value
  }, typeof o === 'string' ? o : o.label))), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 14,
      color: 'var(--text-subtle)',
      pointerEvents: 'none',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 16
  }))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Select.jsx", error: String((e && e.message) || e) }); }

// components/core/StatBlock.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function StatBlock({
  value,
  label,
  align = 'left',
  size = 'md',
  style,
  ...rest
}) {
  const v = size === 'lg' ? 'var(--text-display-3)' : 'var(--text-h2)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      textAlign: align,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--font-sans)',
      fontSize: v,
      fontWeight: 'var(--weight-extrabold)',
      letterSpacing: 'var(--tracking-display)',
      color: 'var(--text-heading)',
      lineHeight: 1.1
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, label));
}
Object.assign(__ds_scope, { StatBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatBlock.jsx", error: String((e && e.message) || e) }); }

// components/core/Wordmark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// The official mark lives at assets/logo-mark.svg (#0065F4 rounded square, white N).
// Pass `logoSrc` with a path relative to the consuming page to show it; the
// type-only lockup is the fallback when no path is available.
function Wordmark({
  size = 20,
  tone = 'default',
  suffix = false,
  logoSrc,
  style,
  ...rest
}) {
  const dark = tone === 'onDark';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: size * 0.4,
      font: 'var(--font-sans)',
      fontSize: size,
      fontWeight: 'var(--weight-extrabold)',
      letterSpacing: 'var(--tracking-heading)',
      color: dark ? 'var(--neutral-0)' : 'var(--text-heading)',
      ...style
    }
  }, rest), logoSrc && /*#__PURE__*/React.createElement("img", {
    src: logoSrc,
    alt: "",
    style: {
      width: size * 1.4,
      height: size * 1.4,
      borderRadius: size * 0.42
    }
  }), /*#__PURE__*/React.createElement("span", null, "NextRaise", suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      color: dark ? 'var(--neutral-400)' : 'var(--text-subtle)',
      fontWeight: 'var(--weight-semibold)'
    }
  }, ".ai")));
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/patterns/AnnouncementBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function AnnouncementBar({
  text,
  ctaLabel = 'Download the Chrome Extension',
  href = '#',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      minHeight: 44,
      padding: '8px 24px',
      background: 'var(--surface-dark)',
      color: 'var(--neutral-0)',
      font: 'var(--type-ui)',
      fontSize: 'var(--text-xs)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--neutral-200)'
    }
  }, text), /*#__PURE__*/React.createElement("a", {
    href: href,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      color: 'var(--brand-300)',
      fontWeight: 'var(--weight-semibold)',
      textDecoration: 'none'
    }
  }, ctaLabel, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 14
  })));
}
Object.assign(__ds_scope, { AnnouncementBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/patterns/AnnouncementBar.jsx", error: String((e && e.message) || e) }); }

// components/patterns/AtsScoreCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function AtsScoreCard({
  score = 0,
  verdict = 'Strong start.',
  note,
  target,
  fixes = [],
  onFixAll,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, _extends({
    padding: "var(--pad-card-lg)",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--gap-card)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, "Your resume analysis"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.ScoreRing, {
    value: score,
    size: 104,
    thickness: 9
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-subtle)'
    }
  }, "of 100"), /*#__PURE__*/React.createElement("strong", {
    style: {
      font: 'var(--font-sans)',
      fontSize: 'var(--text-h3)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-heading)'
    }
  }, verdict), note && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-body)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, note), target && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-success)',
      fontWeight: 'var(--weight-semibold)'
    }
  }, target))), fixes.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 'var(--pad-card)',
      borderRadius: 'var(--radius-card-inner)',
      background: 'var(--surface-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, "Fix these now"), fixes.map(fx => /*#__PURE__*/React.createElement("div", {
    key: fx.label,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: fx.severity === 'high' ? 'var(--red-500)' : 'var(--amber-500)',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "alert-triangle",
    size: 15
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: 'var(--type-ui)',
      color: 'var(--text-heading)'
    }
  }, fx.label), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-success)',
      fontWeight: 'var(--weight-bold)'
    }
  }, "+", fx.points, " pts"))), onFixAll && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "soft",
    size: "sm",
    icon: "sparkles",
    onClick: onFixAll,
    style: {
      alignSelf: 'flex-start',
      marginTop: 4
    }
  }, "Fix all with AI")));
}
Object.assign(__ds_scope, { AtsScoreCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/patterns/AtsScoreCard.jsx", error: String((e && e.message) || e) }); }

// components/patterns/AutofillPanel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function AutofillPanel({
  company,
  role,
  applicants,
  score,
  fields = [],
  filled = 0,
  total = 0,
  credits,
  onAutofill,
  logoSrc,
  style,
  ...rest
}) {
  const pct = total ? Math.round(filled / total * 100) : 0;
  return /*#__PURE__*/React.createElement(__ds_scope.Card, _extends({
    padding: "0",
    style: {
      width: 'var(--extension-panel)',
      overflow: 'hidden',
      boxShadow: 'var(--elevation-popover)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '12px var(--pad-card)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    size: 15,
    logoSrc: logoSrc
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), score != null && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "solid"
  }, score, "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--pad-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, company, applicants ? ` · ${applicants} applicants` : ''), /*#__PURE__*/React.createElement("strong", {
    style: {
      font: 'var(--font-sans)',
      fontSize: 'var(--text-h4)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-heading)'
    }
  }, role)), /*#__PURE__*/React.createElement(__ds_scope.ProgressBar, {
    value: pct,
    label: "Completion",
    caption: `${filled} of ${total}`,
    tone: "var(--surface-brand)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 6
    }
  }, fields.map(fl => /*#__PURE__*/React.createElement("div", {
    key: fl.label,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 10px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--surface-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: fl.done ? 'var(--surface-brand)' : 'var(--text-subtle)',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: fl.done ? 'check-circle-2' : 'circle',
    size: 15
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: 'var(--type-meta)',
      color: 'var(--text-body)'
    }
  }, fl.label), fl.value && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-subtle)',
      maxWidth: 150,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, fl.value)))), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "accent",
    block: true,
    icon: "zap",
    onClick: onAutofill
  }, "Autofill"), credits != null && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-subtle)',
      textAlign: 'center'
    }
  }, credits, " autofill credits left")));
}
Object.assign(__ds_scope, { AutofillPanel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/patterns/AutofillPanel.jsx", error: String((e && e.message) || e) }); }

// components/patterns/JobFilterBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
const GROUPS = [{
  key: 'work',
  label: 'Work model',
  options: ['Remote', 'Hybrid', 'On-site']
}, {
  key: 'exp',
  label: 'Experience level',
  options: ['Fresher', '1–3 years', '3–5 years', '5+ years']
}];
function JobFilterBar({
  countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Singapore'],
  onSearch,
  style,
  ...rest
}) {
  const [sel, setSel] = useState({});
  return /*#__PURE__*/React.createElement(__ds_scope.Card, _extends({
    padding: "var(--pad-card-lg)",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      ...style
    }
  }, rest), GROUPS.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.key,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, g.label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--gap-inline)'
    }
  }, g.options.map(o => /*#__PURE__*/React.createElement(__ds_scope.Chip, {
    key: o,
    selected: sel[g.key] === o,
    onClick: () => setSel(s => ({
      ...s,
      [g.key]: s[g.key] === o ? null : o
    }))
  }, o))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr auto',
      gap: 'var(--gap-control)',
      alignItems: 'end'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Select, {
    label: "Country",
    options: countries
  }), /*#__PURE__*/React.createElement(__ds_scope.Input, {
    label: "Job title",
    icon: "search",
    placeholder: "Product Manager"
  }), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "lg",
    icon: "search",
    onClick: onSearch
  }, "Find jobs")));
}
Object.assign(__ds_scope, { JobFilterBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/patterns/JobFilterBar.jsx", error: String((e && e.message) || e) }); }

// components/patterns/JobMatchCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const verdict = s => s >= 85 ? 'Strong match' : s >= 65 ? 'Good match' : s >= 50 ? 'Partial match' : 'Weak match';
function JobMatchCard({
  company,
  logo,
  title,
  posted,
  department,
  workModel,
  employment,
  salary,
  location,
  level,
  score = 0,
  breakdown = [],
  skills = [],
  extraSkills,
  footnote,
  meta,
  onApply,
  onScore,
  onClick,
  style,
  ...rest
}) {
  const metaRow = meta || [location && {
    icon: 'map-pin',
    text: location
  }, (level || department) && {
    icon: 'briefcase',
    text: level || department
  }, (employment || workModel) && {
    icon: 'clock',
    text: employment || workModel
  }, salary && {
    icon: 'banknote',
    text: salary
  }].filter(Boolean);
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'stretch',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: 'var(--pad-card-lg)',
      borderRadius: 'var(--radius-card)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--elevation-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 'var(--radius-circle)',
      background: 'var(--surface-card)',
      boxShadow: 'var(--ring-inset)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      font: 'var(--font-sans)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-muted)',
      overflow: 'hidden',
      flex: '0 0 auto'
    }
  }, logo ? /*#__PURE__*/React.createElement("img", {
    src: logo,
    alt: company,
    style: {
      width: 26,
      height: 26,
      objectFit: 'contain'
    }
  }) : (company || '?').charAt(0)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6
    }
  }, posted && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-muted)',
      background: 'var(--surface-inset)',
      padding: '3px 8px',
      borderRadius: 'var(--radius-xs)'
    }
  }, posted), /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: score >= 65 ? 'success' : score >= 50 ? 'warning' : 'danger',
    style: {
      height: 21,
      fontSize: 'var(--text-2xs)'
    }
  }, "Job match ", score)), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--type-card-title)',
      margin: 0
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, company), metaRow.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 14,
      marginTop: 10,
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, metaRow.map(m => /*#__PURE__*/React.createElement("span", {
    key: m.text,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: m.icon,
    size: 13
  }), m.text))))), skills.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, skills.map(s => /*#__PURE__*/React.createElement(__ds_scope.Chip, {
    key: s
  }, s)), extraSkills && /*#__PURE__*/React.createElement(__ds_scope.Chip, null, "+", extraSkills, " more")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 'auto'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => e.preventDefault(),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      font: 'var(--type-ui)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-link)'
    }
  }, "View details ", /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-right",
    size: 14
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 6,
      color: 'var(--text-subtle)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "ban",
    size: 16
  }), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "heart",
    size: 16
  })), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    size: "sm",
    icon: "help-circle",
    onClick: onScore
  }, "Match score"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "accent",
    size: "sm",
    iconAfter: "arrow-right",
    onClick: onApply
  }, "Apply with Autofill")), footnote && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      font: 'var(--type-meta)',
      color: 'var(--text-brand)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "users",
    size: 14
  }), footnote)), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 190,
      flex: '0 0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: 'var(--pad-card)',
      borderRadius: 'var(--radius-card)',
      background: 'var(--surface-panel-dark)',
      color: 'var(--neutral-0)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-eyebrow)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-caps)',
      color: 'rgba(255,255,255,.5)'
    }
  }, "Match"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-semibold)',
      marginTop: 2
    }
  }, verdict(score))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.ScoreRing, {
    value: score,
    size: 78,
    thickness: 7,
    style: {
      color: 'var(--neutral-0)'
    },
    onDark: true
  })), breakdown.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, breakdown.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.label,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      font: 'var(--type-meta)',
      fontSize: 'var(--text-2xs)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'rgba(255,255,255,.62)'
    }
  }, b.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--weight-semibold)'
    }
  }, b.value, "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--score-track-dark)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: b.value + '%',
      height: '100%',
      borderRadius: 'var(--radius-pill)',
      background: b.value >= 80 ? 'var(--success-500)' : b.value >= 50 ? 'var(--action-400)' : 'var(--amber-500)',
      transition: 'var(--transition-score)'
    }
  })))))));
}
Object.assign(__ds_scope, { JobMatchCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/patterns/JobMatchCard.jsx", error: String((e && e.message) || e) }); }

// components/patterns/LogoMarquee.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function LogoMarquee({
  items = [],
  label,
  speed = 34,
  style,
  ...rest
}) {
  const row = [...items, ...items];
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-subtle)',
      textAlign: 'center'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      maskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)',
      WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 40,
      width: 'max-content',
      animation: `nr-marquee ${speed}s linear infinite`
    }
  }, row.map((it, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      font: 'var(--type-ui)',
      color: 'var(--text-muted)',
      whiteSpace: 'nowrap'
    }
  }, it.logo && /*#__PURE__*/React.createElement("img", {
    src: it.logo,
    alt: "",
    style: {
      height: 20,
      opacity: 0.75
    }
  }), it.name))), /*#__PURE__*/React.createElement("style", null, '@keyframes nr-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}')));
}
Object.assign(__ds_scope, { LogoMarquee });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/patterns/LogoMarquee.jsx", error: String((e && e.message) || e) }); }

// components/patterns/ReferralRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ReferralRow({
  name,
  role,
  relation,
  tag,
  verified = false,
  avatar,
  onAsk,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px var(--pad-card)',
      borderRadius: 'var(--radius-card-inner)',
      border: '1px solid var(--border-subtle)',
      background: 'var(--surface-card)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    src: avatar,
    name: name,
    size: 38,
    verified: verified
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      font: 'var(--type-ui)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-heading)'
    }
  }, name), tag && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "neutral"
  }, tag)), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, role, relation ? ` · ${relation}` : '')), verified && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-success)'
    }
  }, "Work email verified"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    size: "sm",
    onClick: onAsk
  }, "Ask for referral"));
}
Object.assign(__ds_scope, { ReferralRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/patterns/ReferralRow.jsx", error: String((e && e.message) || e) }); }

// components/patterns/SiteFooter.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const COLUMNS = [{
  title: 'Features',
  links: ['Resume AI', 'AI Job Match', 'Insider Referrals', 'Job Autofill', 'Job Tracker']
}, {
  title: 'Jobs',
  links: ['Browse all jobs', 'Software Engineer · India', 'Remote jobs', 'Job alerts']
}, {
  title: 'Free tools',
  links: ['ATS Resume Checker', 'Resume Keyword Analysis', 'Job Match Check', 'JD Tailor']
}, {
  title: 'Information',
  links: ['About us', 'Pricing', 'Blog', 'Affiliates, earn 30%', 'Help center']
}];
function SiteFooter({
  columns = COLUMNS,
  logoSrc,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("footer", _extends({
    style: {
      background: 'var(--surface-muted)',
      borderTop: '1px solid var(--border-subtle)',
      padding: '56px var(--pad-page) 32px',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1.4fr repeat(4, 1fr)',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      maxWidth: 280
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    size: 22,
    logoSrc: logoSrc
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--type-body)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
      textWrap: 'pretty'
    }
  }, "Your AI job hunting copilot for matched jobs, tailored resumes, autofilled applications and insider referrals."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "linkedin",
    size: 18
  }), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "instagram",
    size: 18
  }), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "twitter",
    size: 18
  }))), columns.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.title,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      font: 'var(--type-eyebrow)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-caps)',
      color: 'var(--text-subtle)'
    }
  }, c.title), c.links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      font: 'var(--type-ui)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-body)',
      textDecoration: 'none'
    }
  }, l))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '40px auto 0',
      paddingTop: 20,
      borderTop: '1px solid var(--border-subtle)',
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      font: 'var(--type-meta)',
      color: 'var(--text-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 ThreeDots Inc."), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: 'inherit',
      textDecoration: 'none'
    }
  }, "Privacy"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: 'inherit',
      textDecoration: 'none'
    }
  }, "Terms"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto'
    }
  }, "Made for the Indian job hunt and 20+ countries beyond.")));
}
Object.assign(__ds_scope, { SiteFooter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/patterns/SiteFooter.jsx", error: String((e && e.message) || e) }); }

// components/patterns/SiteNav.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// v2: floating capsule (recompile touch)

function SiteNav({
  links = [],
  active,
  onNavigate = () => {},
  logoSrc,
  cta = 'Try for free',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 20,
      display: 'flex',
      justifyContent: 'center',
      padding: '18px var(--pad-page)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 36,
      width: '100%',
      maxWidth: 1120,
      height: 76,
      padding: '0 12px 0 22px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-glass)',
      backdropFilter: 'var(--blur-glass)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-float)'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNavigate('home');
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    size: 22,
    suffix: true,
    logoSrc: logoSrc
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      margin: '0 auto',
      whiteSpace: 'nowrap'
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l.id,
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNavigate(l.id);
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      font: 'var(--font-sans)',
      fontSize: 'var(--text-md)',
      fontWeight: 'var(--weight-semibold)',
      letterSpacing: '-0.01em',
      textDecoration: 'none',
      whiteSpace: 'nowrap',
      color: active === l.id ? 'var(--text-brand)' : 'var(--text-heading)',
      transition: 'var(--transition-control)'
    }
  }, l.label, l.dropdown && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 15
  })))), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNavigate('signin');
    },
    style: {
      font: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      textDecoration: 'none',
      whiteSpace: 'nowrap'
    }
  }, "Sign in"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    caps: true,
    size: "md",
    onClick: () => onNavigate('signup')
  }, cta)));
}
Object.assign(__ds_scope, { SiteNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/patterns/SiteNav.jsx", error: String((e && e.message) || e) }); }

// components/patterns/TailoredResumeCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TailoredResumeCard({
  score = 0,
  name,
  summary,
  skills = [],
  experience = [],
  changes = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, _extends({
    padding: "0",
    style: {
      overflow: 'hidden',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '14px var(--pad-card)',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--surface-muted)'
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      font: 'var(--font-sans)',
      fontSize: 'var(--text-h3)',
      fontWeight: 'var(--weight-extrabold)',
      color: 'var(--text-heading)'
    }
  }, score), /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "success"
  }, "Strong match")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--pad-card-lg)',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      font: 'var(--font-sans)',
      fontSize: 'var(--text-h4)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-heading)'
    }
  }, name), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    style: {
      font: 'var(--type-eyebrow)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-caps)',
      color: 'var(--text-subtle)',
      marginBottom: 6
    }
  }, "Professional Summary"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--type-body)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-body)',
      textWrap: 'pretty'
    }
  }, summary)), skills.length > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    style: {
      font: 'var(--type-eyebrow)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-caps)',
      color: 'var(--text-subtle)',
      marginBottom: 6
    }
  }, "Skills"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--type-body)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, skills.join(' · '))), experience.length > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    style: {
      font: 'var(--type-eyebrow)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-caps)',
      color: 'var(--text-subtle)',
      marginBottom: 6
    }
  }, "Experience"), experience.map(e => /*#__PURE__*/React.createElement("div", {
    key: e.role,
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12,
      font: 'var(--type-ui)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-heading)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--weight-semibold)'
    }
  }, e.role), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-subtle)'
    }
  }, e.dates)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      font: 'var(--type-body)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
      textWrap: 'pretty'
    }
  }, "\u2022 ", e.bullet)))), changes.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      paddingTop: 4
    }
  }, changes.map(c => /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    key: c,
    tone: "success",
    icon: "check"
  }, c)))));
}
Object.assign(__ds_scope, { TailoredResumeCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/patterns/TailoredResumeCard.jsx", error: String((e && e.message) || e) }); }

// components/patterns/TestimonialCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TestimonialCard({
  quote,
  name,
  title,
  location,
  avatar,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, _extends({
    padding: "var(--pad-card-lg)",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--type-body)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-body)',
      textWrap: 'pretty'
    }
  }, "\u201C", quote, "\u201D"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 'auto'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    src: avatar,
    name: name,
    size: 36
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-ui)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-heading)'
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-subtle)'
    }
  }, title, location ? ` · ${location}` : ''))));
}
Object.assign(__ds_scope, { TestimonialCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/patterns/TestimonialCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/extension/AutofillFlow.jsx
try { (() => {
function AutofillFlow() {
  const {
    Card,
    Button,
    AutofillPanel,
    Badge,
    Icon
  } = window.NextRaiseDesignSystem_94a86a;
  const FIELDS = [{
    label: 'Full name',
    value: 'Priya Sharma'
  }, {
    label: 'Email',
    value: 'priya.sharma@gmail.com'
  }, {
    label: 'Phone',
    value: '+91 98xxx xxx21'
  }, {
    label: 'Current company',
    value: 'Juspay'
  }, {
    label: 'Total experience',
    value: '4 years'
  }, {
    label: 'Notice period',
    value: '30 days'
  }, {
    label: 'Expected CTC',
    value: ''
  }];
  const [filled, setFilled] = React.useState(3);
  const [running, setRunning] = React.useState(false);
  const run = () => {
    if (running) return;
    setRunning(true);
    let n = filled;
    const tick = setInterval(() => {
      n += 1;
      setFilled(n);
      if (n >= 6) {
        clearInterval(tick);
        setRunning(false);
      }
    }, 320);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr var(--extension-panel)',
      gap: 20,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "var(--pad-card-lg)",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-subtle)'
    }
  }, "deloitte.wd3.myworkdayjobs.com/apply"), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--weight-bold) var(--text-h2)/1.2 var(--font-sans)',
      margin: '8px 0 0'
    }
  }, "Apply for Senior Consultant")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, FIELDS.map((fl, i) => {
    const done = i < filled;
    return /*#__PURE__*/React.createElement("label", {
      key: fl.label,
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'var(--type-meta)',
        color: 'var(--text-muted)'
      }
    }, fl.label), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 46,
        padding: '0 12px',
        borderRadius: 'var(--radius-input)',
        border: `1px solid ${done ? 'var(--border-brand)' : 'var(--border-subtle)'}`,
        background: done ? 'var(--surface-brand-soft)' : 'var(--surface-card)',
        font: 'var(--type-ui)',
        color: done ? 'var(--text-heading)' : 'var(--text-subtle)',
        transition: 'var(--transition-control)'
      }
    }, done && /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--surface-brand)',
        display: 'flex'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 15
    })), done ? fl.value || '—' : 'Not filled'));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary"
  }, "Submit application"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-subtle)'
    }
  }, "The submit button stays yours."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      position: 'sticky',
      top: 0
    }
  }, /*#__PURE__*/React.createElement(AutofillPanel, {
    company: "Deloitte",
    role: "Senior Consultant, Strategy",
    applicants: 63,
    score: 86,
    filled: filled,
    total: FIELDS.length,
    credits: 5,
    fields: FIELDS.map((fl, i) => ({
      label: fl.label,
      value: fl.value,
      done: i < filled
    })),
    onAutofill: run
  }), /*#__PURE__*/React.createElement(Badge, {
    tone: running ? 'brand' : 'neutral',
    dot: true,
    style: {
      alignSelf: 'center'
    }
  }, running ? 'Autofilling…' : 'Works on Naukri, LinkedIn, Workday + 80 more')));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/extension/AutofillFlow.jsx", error: String((e && e.message) || e) }); }

// ui_kits/extension/ResumePanel.jsx
try { (() => {
function ResumePanel() {
  const {
    AtsScoreCard,
    TailoredResumeCard,
    Card,
    Button,
    Wordmark,
    Badge,
    Icon
  } = window.NextRaiseDesignSystem_94a86a;
  const [fixed, setFixed] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '380px 1fr',
      gap: 20,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "12px var(--pad-card)",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    size: 15,
    logoSrc: "../../assets/logo-mark.svg"
  }), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral",
    style: {
      marginLeft: 'auto'
    }
  }, "Priya Sharma \xB7 resume.pdf")), /*#__PURE__*/React.createElement(AtsScoreCard, {
    score: fixed ? 90 : 72,
    verdict: fixed ? 'Impossible to overlook.' : 'Strong start.',
    note: fixed ? 'Every flagged line is fixed. Re-download and apply.' : 'A few fixes make it impossible to overlook.',
    target: fixed ? 'Target 90 · reached' : 'Target 90 · +18 pts available',
    fixes: fixed ? [] : [{
      label: 'Weak verbs',
      points: 6
    }, {
      label: 'Quantified impact',
      points: 4,
      severity: 'high'
    }, {
      label: 'Missing JD keywords',
      points: 8
    }],
    onFixAll: () => setFixed(true)
  }), fixed && /*#__PURE__*/React.createElement(Card, {
    tone: "success",
    padding: "var(--pad-card)",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--surface-brand)',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check-circle-2",
    size: 18
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-ui)',
      color: 'var(--text-heading)'
    }
  }, "3 fixes applied \xB7 +18 pts"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "soft",
    style: {
      marginLeft: 'auto'
    }
  }, "Download"))), /*#__PURE__*/React.createElement(TailoredResumeCard, {
    score: fixed ? 94 : 86,
    name: "Priya Sharma",
    summary: "Backend engineer with 4 years building payments infrastructure at scale. Shipped a merchant dashboard used by 40K businesses and streamed 10K events/s through Kafka-style pipelines. Looking to own payment reliability on a high-volume fintech team.",
    skills: ['Node.js', 'TypeScript', 'React', 'PostgreSQL', 'Redis', 'AWS', 'Docker', 'GraphQL', 'Kafka', 'Payment APIs', 'PCI-DSS'],
    experience: [{
      role: 'Software Engineer II, Juspay · Bengaluru',
      dates: 'Jun 2022 – Present',
      bullet: 'Cut checkout failures 38% by rebuilding the retry layer for UPI and card payments, processing 2M transactions a day at 99.99% uptime'
    }],
    changes: fixed ? ['Summary Enhanced', 'Relevant Skills Highlighted', 'Recent Work Experience Enhanced', 'Weak verbs replaced'] : ['Summary Enhanced', 'Relevant Skills Highlighted']
  }));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/extension/ResumePanel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/extension/ScoreOverlay.jsx
try { (() => {
function ScoreOverlay() {
  const {
    Card,
    Badge,
    Button,
    Chip,
    ScoreRing,
    ProgressBar,
    ReferralRow,
    Wordmark,
    Icon
  } = window.NextRaiseDesignSystem_94a86a;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr var(--extension-panel)',
      gap: 20,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      borderRadius: 'var(--radius-card)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-subtle)'
    }
  }, "deloitte.wd3.myworkdayjobs.com"), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--weight-bold) var(--text-h1)/1.2 var(--font-sans)',
      margin: '10px 0 6px'
    }
  }, "Senior Consultant, Strategy"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, "Deloitte \xB7 Mumbai, India \xB7 Full-time \xB7 63 applicants"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, ['Lead client engagements across growth strategy and market entry mandates.', 'Build financial models, market sizing and diligence packs for CXO audiences.', 'Mentor analysts and own workstream delivery end to end.'].map(t => /*#__PURE__*/React.createElement("p", {
    key: t,
    style: {
      margin: 0,
      font: 'var(--type-body)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)',
      textWrap: 'pretty'
    }
  }, t)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 10,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-inset)',
      width: '90%',
      marginTop: 8
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 10,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-inset)',
      width: '76%'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 10,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-inset)',
      width: '84%'
    }
  }))), /*#__PURE__*/React.createElement(Card, {
    padding: "0",
    style: {
      overflow: 'hidden',
      boxShadow: 'var(--elevation-popover)',
      position: 'sticky',
      top: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '12px var(--pad-card)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    size: 15,
    logoSrc: "../../assets/logo-mark.svg"
  }), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral",
    style: {
      marginLeft: 'auto'
    }
  }, "Scored this page")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--pad-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(ScoreRing, {
    value: 61,
    size: 84
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      font: 'var(--font-sans)',
      fontSize: 'var(--text-h4)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-heading)'
    }
  }, "Tailor before you apply"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, "Match to your resume"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-success)',
      fontWeight: 'var(--weight-semibold)'
    }
  }, "+27 pts available"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 10,
      padding: 'var(--pad-card)',
      borderRadius: 'var(--radius-card-inner)',
      background: 'var(--surface-muted)'
    }
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    value: 58,
    label: "Skills match",
    caption: "11 of 19"
  }), /*#__PURE__*/React.createElement(ProgressBar, {
    value: 80,
    label: "Experience",
    caption: "4 of 5 yrs"
  }), /*#__PURE__*/React.createElement(ProgressBar, {
    value: 100,
    label: "Job title",
    caption: "close"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, "Missing keywords"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8
    }
  }, ['Market entry', 'Diligence', 'CXO reporting', 'Financial modelling'].map(s => /*#__PURE__*/React.createElement(Chip, {
    key: s
  }, s)))), /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    block: true,
    icon: "sparkles"
  }, "Tailor my resume"), /*#__PURE__*/React.createElement(Button, {
    block: true,
    variant: "secondary",
    icon: "zap"
  }, "Autofill this application"), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border-subtle)',
      paddingTop: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, "Found 2 insiders at Deloitte"), /*#__PURE__*/React.createElement(ReferralRow, {
    name: "Nikki I.",
    role: "Senior Recruiter",
    tag: "Hiring manager",
    onAsk: () => {},
    style: {
      padding: 10
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      font: 'var(--type-meta)',
      color: 'var(--text-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    size: 13
  }), "Nothing is submitted without your review."))));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/extension/ScoreOverlay.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Home.jsx
try { (() => {
function Home({
  onNavigate = () => {}
}) {
  const {
    AnnouncementBar,
    SiteNav,
    SiteFooter,
    Button,
    Badge,
    Card,
    StatBlock,
    Icon,
    JobMatchCard,
    AtsScoreCard,
    TailoredResumeCard,
    AutofillPanel,
    ReferralRow,
    TestimonialCard,
    JobFilterBar,
    LogoMarquee,
    Accordion
  } = window.NextRaiseDesignSystem_94a86a;
  const section = {
    maxWidth: 'var(--container-max)',
    margin: '0 auto',
    padding: '0 var(--pad-page)'
  };
  const eyebrow = {
    font: 'var(--type-eyebrow)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--tracking-caps)',
    color: 'var(--text-brand)'
  };
  const h2 = {
    font: 'var(--type-section)',
    letterSpacing: 'var(--tracking-display)',
    margin: '8px 0 12px'
  };
  const lede = {
    margin: 0,
    maxWidth: 560,
    font: 'var(--type-body)',
    color: 'var(--text-muted)',
    textWrap: 'pretty'
  };
  const feature = (i, title, body, cta, visual) => /*#__PURE__*/React.createElement("div", {
    key: title,
    style: {
      display: 'grid',
      gridTemplateColumns: i % 2 ? '1fr 1.1fr' : '1.1fr 1fr',
      gap: 56,
      alignItems: 'center',
      direction: i % 2 ? 'ltr' : 'ltr'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      order: i % 2 ? 0 : 1
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--weight-bold) var(--text-h1)/1.15 var(--font-sans)',
      letterSpacing: 'var(--tracking-heading)',
      margin: '0 0 10px'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      ...lede,
      marginBottom: 20
    }
  }, body), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    iconAfter: "chevron-right"
  }, cta)), /*#__PURE__*/React.createElement("div", {
    style: {
      order: i % 2 ? 1 : 0
    }
  }, visual));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(AnnouncementBar, {
    text: "Supercharge your job hunt with 100+ tailored applications in 1 click"
  }), /*#__PURE__*/React.createElement(SiteNav, {
    logoSrc: "../../assets/logo-mark.svg",
    active: "home",
    onNavigate: onNavigate,
    links: [{
      id: 'features',
      label: 'Features',
      dropdown: true
    }, {
      id: 'jobs',
      label: 'Find Jobs'
    }, {
      id: 'autofill',
      label: 'AI Autofill'
    }, {
      id: 'ats',
      label: 'ATS Check'
    }, {
      id: 'affiliate',
      label: 'Affiliate'
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      backgroundImage: 'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
      backgroundSize: '56px 56px',
      backgroundPosition: 'center top',
      paddingBottom: 72
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1320,
      margin: '0 auto',
      padding: '48px var(--pad-page) 0',
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.12fr)',
      gap: 48,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "0",
    style: {
      overflow: 'hidden',
      boxShadow: 'var(--elevation-modal)',
      background: 'var(--neutral-25)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '12px 16px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, ['#CDD3E0', '#CDD3E0', '#CDD3E0'].map((c, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: c
    }
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      margin: '0 auto',
      padding: '6px 14px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-card)',
      boxShadow: 'var(--shadow-xs)',
      font: 'var(--type-meta)',
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 12
  }), "nextraise.ai/jobs"), /*#__PURE__*/React.createElement(Badge, {
    tone: "live",
    dot: true
  }, "Live demo")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(JobMatchCard, {
    company: "Google",
    title: "Senior Software Engineer",
    posted: "1 day ago",
    location: "London, UK",
    level: "Senior",
    employment: "5-8 years",
    salary: "\xA3110K \u2013 \xA3155K",
    score: 91,
    breakdown: [{
      label: 'Skills',
      value: 92
    }, {
      label: 'Keywords',
      value: 87
    }, {
      label: 'Experience',
      value: 82
    }]
  }), /*#__PURE__*/React.createElement(JobMatchCard, {
    company: "Barclays",
    title: "Senior Software Engineer",
    posted: "2 days ago",
    location: "London, UK",
    level: "Senior",
    employment: "5-9 years",
    salary: "\xA385K \u2013 \xA3120K",
    score: 68,
    breakdown: [{
      label: 'Skills',
      value: 71
    }, {
      label: 'Keywords',
      value: 64
    }, {
      label: 'Experience',
      value: 78
    }]
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      letterSpacing: 'var(--tracking-display)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: 'var(--weight-bold) clamp(34px, 3.6vw, var(--text-display-2))/1.06 var(--font-sans)',
      whiteSpace: 'nowrap'
    }
  }, "No more solo job hunting"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: 'var(--weight-extrabold) clamp(56px, 6vw, var(--text-display-0))/1.0 var(--font-sans)',
      marginTop: 6
    }
  }, "Do it with ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--action-500)'
    }
  }, "agents"))), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '24px 0 0',
      maxWidth: 520,
      font: 'var(--type-body)',
      fontSize: 'var(--text-xl)',
      lineHeight: 1.6,
      color: 'var(--text-body)',
      textWrap: 'pretty'
    }
  }, "Get matched jobs, a resume that clears the ATS, rewrites tailored to every JD, autofilled applications and insider referrals, all in less than a minute."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    caps: true,
    onClick: () => onNavigate('jobs')
  }, "Try for free")), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-body)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)',
      marginTop: 18
    }
  }, "Free to start. No initial payment or transaction required."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 56,
      marginTop: 32,
      paddingTop: 28,
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--amber-500)',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "star",
    size: 22
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--font-sans)',
      fontSize: 'var(--text-h2)',
      fontWeight: 'var(--weight-extrabold)',
      letterSpacing: 'var(--tracking-display)',
      color: 'var(--text-heading)'
    }
  }, "5.0")), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, "Chrome Web Store rating")), /*#__PURE__*/React.createElement(StatBlock, {
    value: "500K+",
    label: "job seekers on NextRaise"
  }), /*#__PURE__*/React.createElement(StatBlock, {
    value: "Google",
    label: "Featured by Google"
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...section,
      marginTop: 96
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 32,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: eyebrow
  }, "Fresh openings"), /*#__PURE__*/React.createElement("h2", {
    style: h2
  }, "Get access to the newest job postings")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement(StatBlock, {
    value: "100+",
    label: "Job boards & ATS covered"
  }), /*#__PURE__*/React.createElement(StatBlock, {
    value: "2M+",
    label: "Total jobs"
  }), /*#__PURE__*/React.createElement(StatBlock, {
    value: "10 Lakh+",
    label: "Jobs added daily"
  }))), /*#__PURE__*/React.createElement(Card, {
    tone: "muted",
    padding: "var(--pad-card-lg)",
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "live",
    dot: true
  }, "Live \xB7 posted in the last 24 hours"), /*#__PURE__*/React.createElement(LogoMarquee, {
    style: {
      marginTop: 16
    },
    items: [{
      name: 'Microsoft · Product Manager · 2 hours ago'
    }, {
      name: 'Google · Program Manager · today'
    }, {
      name: 'OpenAI · Solutions Engineer · 1 hour ago'
    }, {
      name: 'Unilever · Brand Manager · today'
    }, {
      name: 'JPMorgan · Business Analyst · 5 hr ago'
    }, {
      name: 'LinkedIn · Product Marketing Manager · today'
    }, {
      name: 'Anthropic · Product Designer · today'
    }, {
      name: 'Amazon · Category Manager · 2 hours ago'
    }]
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...section,
      marginTop: 'var(--gap-section)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      ...h2,
      textAlign: 'center',
      marginBottom: 56
    }
  }, "No.1 AI ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--surface-brand)'
    }
  }, "job hunting"), " platform"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 88
    }
  }, feature(0, 'Personalized job matches', 'See the jobs you are truly qualified for. Every role is matched to your real skills, with no fake listings and early alerts.', 'Find My Matches', /*#__PURE__*/React.createElement(JobMatchCard, {
    company: "Google",
    title: "Software Engineer II",
    posted: "2h ago \xB7 early applicant",
    location: "Bengaluru, IN",
    level: "Senior",
    employment: "5+ years",
    salary: "\u20B935L \u2013 \u20B955L/yr",
    score: 96,
    breakdown: [{
      label: 'Skills',
      value: 95
    }, {
      label: 'Keywords',
      value: 91
    }, {
      label: 'Experience',
      value: 100
    }],
    footnote: "1 college alum works here \xB7 less than 20 applicants"
  })), feature(1, 'ATS-optimized resume', 'Run 20+ recruiter software checks, see every line that gets you filtered out, and fix each one with a single click before you apply.', 'Check My ATS Score', /*#__PURE__*/React.createElement(AtsScoreCard, {
    score: 72,
    verdict: "Strong start.",
    note: "A few fixes make it impossible to overlook.",
    target: "Target 90 \xB7 +18 pts available",
    fixes: [{
      label: 'Weak verbs',
      points: 6
    }, {
      label: 'Quantified impact',
      points: 4
    }],
    onFixAll: () => {}
  })), feature(2, 'Create job-tailored resumes', 'Get a perfectly tailored professional resume that passes the ATS and mirrors the language of the role, ready in about two minutes.', 'Tailor My Resume', /*#__PURE__*/React.createElement(TailoredResumeCard, {
    score: 86,
    name: "Priya Sharma",
    summary: "Backend engineer with 4 years building payments infrastructure at scale. Shipped a merchant dashboard used by 40K businesses and streamed 10K events/s through Kafka-style pipelines.",
    skills: ['Node.js', 'TypeScript', 'React', 'PostgreSQL', 'Redis', 'AWS', 'Kafka', 'Payment APIs'],
    experience: [{
      role: 'Software Engineer II, Juspay · Bengaluru',
      dates: 'Jun 2022 – Present',
      bullet: 'Cut checkout failures 38% by rebuilding the retry layer for UPI and card payments, processing 2M transactions a day at 99.99% uptime'
    }],
    changes: ['Summary Enhanced', 'Relevant Skills Highlighted', 'Recent Work Experience Enhanced']
  })), feature(3, 'One-click job apply', 'Apply across all the major boards and ATS portals, including Naukri, LinkedIn, Workday and 50+ more. Skip the retyping and save hours every week.', 'Start Autofilling', /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(AutofillPanel, {
    company: "Deloitte",
    role: "Senior Consultant, Strategy",
    applicants: 63,
    score: 86,
    filled: 10,
    total: 12,
    credits: 5,
    fields: [{
      label: 'Full name',
      value: 'Priya Sharma',
      done: true
    }, {
      label: 'Email',
      value: 'priya.sharma@gmail.com',
      done: true
    }, {
      label: 'Phone',
      value: '+91 98xxx xxx21',
      done: true
    }, {
      label: 'Notice period',
      value: '30 days'
    }, {
      label: 'Expected CTC'
    }],
    onAutofill: () => {}
  }))), feature(4, 'Get referrals from company insiders', 'Raise your interview chances with insider referrals. Find the recruiters, hiring managers and alumni behind any job and connect with them directly.', 'Find referrals', /*#__PURE__*/React.createElement(Card, {
    padding: "var(--pad-card-lg)",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, "Found 3 contacts at Razorpay"), /*#__PURE__*/React.createElement(ReferralRow, {
    name: "Ethan & Tobi",
    role: "Engineering",
    relation: "previously with you at ABC Tech",
    tag: "Your previous company",
    verified: true,
    onAsk: () => {}
  }), /*#__PURE__*/React.createElement(ReferralRow, {
    name: "Nikki I.",
    role: "Senior Recruiter \xB7 Payments",
    tag: "Hiring manager",
    onAsk: () => {}
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...section,
      marginTop: 'var(--gap-section)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      ...h2,
      textAlign: 'center',
      marginBottom: 32
    }
  }, "Loved by 1 million+ job seekers"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 'var(--gap-stack)'
    }
  }, [['The match score told me to skip 8 of 10 jobs I was about to apply to. The two I tailored for both called back.', 'Daniel K.', 'Product Manager', 'San Francisco'], ['Applying to US roles with an Indian resume was brutal until the tailor rewrote it for each JD. Three onsites in my first month.', 'Priyanka S.', 'Software Engineer', 'San Francisco'], ['The ATS audit explained why my applications kept vanishing. I fixed the flagged lines and the callbacks doubled.', 'Emma W.', 'Marketing Manager', 'Los Angeles'], ['I moved cities with zero network. The match scores showed me where I actually stood, and I signed an offer in five weeks.', 'Michael T.', 'Data Scientist', 'San Francisco'], ['The referral drafts got replies where cold applications never did. Two of my interviews came straight from those messages.', 'Rohan V.', 'Strategy Consultant', 'Dubai'], ["Found the recruiter's actual email behind a Workday posting. The referral was drafted and sent, and I had an interview in four days.", 'Sophia L.', 'Business Analyst', 'New York']].map(([q, n, t, l]) => /*#__PURE__*/React.createElement(TestimonialCard, {
    key: n,
    quote: q,
    name: n,
    title: t,
    location: l
  }))), /*#__PURE__*/React.createElement(LogoMarquee, {
    style: {
      marginTop: 56
    },
    label: "Our users come from",
    items: ['UCLA', 'Stanford', 'Harvard', 'UC Berkeley', 'NYU', 'Columbia', 'Oxford', 'Cambridge', 'Imperial College London', 'LSE', 'IIT Bombay', 'IIT Delhi', 'IIM Ahmedabad'].map(n => ({
      name: n
    }))
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-narrow)',
      margin: 'var(--gap-section) auto 0',
      padding: '0 var(--pad-page)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: eyebrow
  }, "FAQ"), /*#__PURE__*/React.createElement("h2", {
    style: h2
  }, "Frequently asked ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--surface-brand)'
    }
  }, "questions")), /*#__PURE__*/React.createElement(Accordion, {
    defaultOpen: 0,
    items: [{
      question: 'How is NextRaise different from job platforms like LinkedIn?',
      answer: "LinkedIn shows you listings; NextRaise tells you which ones you'll actually get shortlisted for. Every job is scored against your real resume, your resume gets tailored to the JD, the application gets autofilled, and you get insider referral contacts. It is one platform for the whole hunt, not just the search."
    }, {
      question: 'Will NextRaise share my personal information?',
      answer: 'No. Your resume and profile are used only to score, tailor, and fill your own applications. Nothing is shared with employers or job boards until you choose to submit, and your data is never sold.'
    }, {
      question: 'Is NextRaise free to use?',
      answer: 'Yes, it is free to start with no initial payment or transaction required. The free tier includes your resume, ATS checks, tailored resumes and referral drafts to try on real applications. Pro removes every limit with a one time payment from ₹399, and nothing auto renews.'
    }, {
      question: "Where do NextRaise's job listings come from?",
      answer: 'We track openings across 100+ job portals and company career pages, refreshed daily, in 20+ countries, all deduplicated into one feed and scored against your resume.'
    }, {
      question: 'Does NextRaise apply to jobs for me automatically?',
      answer: 'It autofills the form and drafts every message, but the submit button stays yours. Nothing is ever sent without your review.'
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-narrow)',
      margin: 'var(--gap-section) auto 96px',
      padding: '0 var(--pad-page)',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: h2
  }, "Find your perfect job in a click!"), /*#__PURE__*/React.createElement("p", {
    style: {
      ...lede,
      margin: '0 auto 24px'
    }
  }, "Pick what fits. Every result is scored against your resume."), /*#__PURE__*/React.createElement(JobFilterBar, {
    onSearch: () => onNavigate('jobs'),
    style: {
      textAlign: 'left'
    }
  })), /*#__PURE__*/React.createElement(SiteFooter, {
    logoSrc: "../../assets/logo-mark.svg"
  }));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/JobsPage.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const JOBS = [{
  company: 'Google',
  title: 'Senior Software Engineer',
  posted: '1 day ago',
  location: 'London, UK',
  level: 'Senior',
  employment: '5-8 years',
  salary: '£110K – £155K',
  score: 91,
  breakdown: [{
    label: 'Skills',
    value: 92
  }, {
    label: 'Keywords',
    value: 87
  }, {
    label: 'Experience',
    value: 82
  }]
}, {
  company: 'Barclays',
  title: 'Senior Software Engineer',
  posted: '2 days ago',
  location: 'London, UK',
  level: 'Senior',
  employment: '5-9 years',
  salary: '£85K – £120K',
  score: 68,
  breakdown: [{
    label: 'Skills',
    value: 71
  }, {
    label: 'Keywords',
    value: 64
  }, {
    label: 'Experience',
    value: 78
  }]
}, {
  company: 'Apple',
  title: 'Software Engineer · Platform',
  posted: '3 days ago',
  location: 'London, UK',
  level: 'Mid',
  employment: '3-6 years',
  salary: '£95K – £135K',
  score: 86,
  breakdown: [{
    label: 'Skills',
    value: 88
  }, {
    label: 'Keywords',
    value: 83
  }, {
    label: 'Experience',
    value: 80
  }]
}, {
  company: 'Accenture',
  title: 'Software Engineer · Technology',
  posted: '5 days ago',
  location: 'London, UK',
  level: 'Mid',
  employment: '3-5 years',
  salary: '£70K – £100K',
  score: 79,
  breakdown: [{
    label: 'Skills',
    value: 82
  }, {
    label: 'Keywords',
    value: 76
  }, {
    label: 'Experience',
    value: 74
  }]
}];
function JobsPage({
  onNavigate = () => {}
}) {
  const {
    SiteNav,
    SiteFooter,
    Card,
    Chip,
    Input,
    Select,
    Badge,
    JobMatchCard,
    ScoreRing,
    Button,
    ReferralRow
  } = window.NextRaiseDesignSystem_94a86a;
  const [filter, setFilter] = React.useState('All');
  const [selected, setSelected] = React.useState(0);
  const shown = filter === 'All' ? JOBS : JOBS.filter(jb => filter === 'Strong match' ? jb.score >= 80 : jb.score < 80);
  const job = shown[Math.min(selected, shown.length - 1)] || JOBS[0];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-muted)',
      minHeight: '100vh'
    }
  }, /*#__PURE__*/React.createElement(SiteNav, {
    logoSrc: "../../assets/logo-mark.svg",
    active: "jobs",
    onNavigate: onNavigate,
    links: [{
      id: 'jobs',
      label: 'Find Jobs'
    }, {
      id: 'autofill',
      label: 'AI Autofill'
    }, {
      id: 'ats',
      label: 'ATS Check'
    }, {
      id: 'affiliate',
      label: 'Affiliate'
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '24px var(--pad-page) 72px',
      display: 'grid',
      gridTemplateColumns: '250px 1fr 340px',
      gap: 'var(--gap-stack)',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "var(--pad-card)",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      position: 'sticky',
      top: 92
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Job title"
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Country",
    options: ['India', 'United States', 'United Kingdom', 'Canada', 'Singapore']
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, "Work model"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, ['Remote', 'Hybrid', 'On-site'].map(o => /*#__PURE__*/React.createElement(Chip, {
    key: o
  }, o)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, "Experience level"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, ['Fresher', '1–3 years', '3–5 years', '5+ years'].map(o => /*#__PURE__*/React.createElement(Chip, {
    key: o
  }, o))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--gap-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, ['All', 'Strong match', 'Needs work'].map(t => /*#__PURE__*/React.createElement(Chip, {
    key: t,
    selected: filter === t,
    onClick: () => {
      setFilter(t);
      setSelected(0);
    }
  }, t)), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, shown.length, " jobs \xB7 scored against your resume")), shown.map((j, i) => /*#__PURE__*/React.createElement(JobMatchCard, _extends({
    key: j.company
  }, j, {
    onClick: () => setSelected(i),
    onApply: () => {},
    onScore: () => {},
    style: {
      outline: job.company === j.company ? '2px solid var(--border-brand)' : 'none',
      outlineOffset: 3,
      borderRadius: 'var(--radius-card)'
    }
  })))), /*#__PURE__*/React.createElement(Card, {
    padding: "var(--pad-card-lg)",
    style: {
      position: 'sticky',
      top: 92,
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(ScoreRing, {
    value: job.score,
    size: 72
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-ui)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-heading)'
    }
  }, job.title), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, job.company, " \xB7 ", job.location))), /*#__PURE__*/React.createElement(Badge, {
    tone: job.score >= 80 ? 'success' : 'warning'
  }, job.score >= 80 ? 'Apply — strong match' : 'Tailor your resume first'), /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    block: true,
    icon: "sparkles"
  }, "Tailor my resume"), /*#__PURE__*/React.createElement(Button, {
    block: true,
    variant: "secondary",
    icon: "zap"
  }, "Autofill application"), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border-subtle)',
      paddingTop: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, "Insiders at ", job.company), /*#__PURE__*/React.createElement(ReferralRow, {
    name: "Nikki I.",
    role: "Senior Recruiter",
    tag: "Hiring manager",
    onAsk: () => {},
    style: {
      padding: 10
    }
  })))), /*#__PURE__*/React.createElement(SiteFooter, {
    logoSrc: "../../assets/logo-mark.svg"
  }));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/JobsPage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/PricingPage.jsx
try { (() => {
function PricingPage({
  onNavigate = () => {}
}) {
  const {
    SiteNav,
    SiteFooter,
    Card,
    Button,
    Badge,
    Icon,
    Accordion
  } = window.NextRaiseDesignSystem_94a86a;
  const row = t => /*#__PURE__*/React.createElement("li", {
    key: t,
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      font: 'var(--type-body)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--surface-brand)',
      display: 'flex',
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 16
  })), t);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SiteNav, {
    logoSrc: "../../assets/logo-mark.svg",
    active: "pricing",
    onNavigate: onNavigate,
    links: [{
      id: 'jobs',
      label: 'Find Jobs'
    }, {
      id: 'autofill',
      label: 'AI Autofill'
    }, {
      id: 'ats',
      label: 'ATS Check'
    }, {
      id: 'affiliate',
      label: 'Affiliate'
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-narrow)',
      margin: '0 auto',
      padding: '72px var(--pad-page) 0',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--type-section)',
      letterSpacing: 'var(--tracking-display)',
      margin: 0
    }
  }, "Free to start. Pro is a ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--surface-brand)'
    }
  }, "one time"), " payment."), /*#__PURE__*/React.createElement("p", {
    style: {
      maxWidth: 520,
      margin: '16px auto 0',
      font: 'var(--type-body)',
      color: 'var(--text-muted)',
      textWrap: 'pretty'
    }
  }, "No initial payment or transaction required. Pro removes every limit from \u20B9399, and nothing auto renews.")), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-narrow)',
      margin: '40px auto 0',
      padding: '0 var(--pad-page)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--gap-stack)',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "var(--pad-card-lg)",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-card-title)'
    }
  }, "Free"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, "Try it on real applications")), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--font-sans)',
      fontSize: 'var(--text-display-3)',
      fontWeight: 'var(--weight-extrabold)',
      letterSpacing: 'var(--tracking-display)',
      color: 'var(--text-heading)'
    }
  }, "\u20B90"), /*#__PURE__*/React.createElement("ul", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      listStyle: 'none',
      margin: 0,
      padding: 0
    }
  }, ['Your resume and ATS checks', 'Tailored resumes to try', 'Referral drafts', 'Scored job matches'].map(row)), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    block: true,
    onClick: () => onNavigate('jobs'),
    style: {
      marginTop: 'auto'
    }
  }, "Sign up for free")), /*#__PURE__*/React.createElement(Card, {
    padding: "var(--pad-card-lg)",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      border: '1px solid var(--border-brand)',
      boxShadow: 'var(--elevation-popover)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-card-title)'
    }
  }, "Pro"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-meta)',
      color: 'var(--text-muted)'
    }
  }, "Every limit removed")), /*#__PURE__*/React.createElement(Badge, {
    tone: "brand",
    style: {
      marginLeft: 'auto'
    }
  }, "One time payment")), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--font-sans)',
      fontSize: 'var(--text-display-3)',
      fontWeight: 'var(--weight-extrabold)',
      letterSpacing: 'var(--tracking-display)',
      color: 'var(--text-heading)'
    }
  }, "from \u20B9399"), /*#__PURE__*/React.createElement("ul", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      listStyle: 'none',
      margin: 0,
      padding: 0
    }
  }, ['Unlimited ATS checks and tailoring', 'Unlimited autofill credits', 'Insider referral contacts', 'Nothing auto renews'].map(row)), /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    block: true,
    icon: "sparkles",
    style: {
      marginTop: 'auto'
    }
  }, "Go Pro"))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-narrow)',
      margin: '72px auto 96px',
      padding: '0 var(--pad-page)'
    }
  }, /*#__PURE__*/React.createElement(Accordion, {
    defaultOpen: 0,
    items: [{
      question: 'Is NextRaise free to use?',
      answer: 'Yes, it is free to start with no initial payment or transaction required. Pro removes every limit with a one time payment from ₹399, and nothing auto renews.'
    }, {
      question: 'Does NextRaise apply to jobs for me automatically?',
      answer: 'It autofills the form and drafts every message, but the submit button stays yours. Nothing is ever sent without your review.'
    }]
  })), /*#__PURE__*/React.createElement(SiteFooter, {
    logoSrc: "../../assets/logo-mark.svg"
  }));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/PricingPage.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Accordion = __ds_scope.Accordion;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.ScoreRing = __ds_scope.ScoreRing;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.StatBlock = __ds_scope.StatBlock;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.AnnouncementBar = __ds_scope.AnnouncementBar;

__ds_ns.AtsScoreCard = __ds_scope.AtsScoreCard;

__ds_ns.AutofillPanel = __ds_scope.AutofillPanel;

__ds_ns.JobFilterBar = __ds_scope.JobFilterBar;

__ds_ns.JobMatchCard = __ds_scope.JobMatchCard;

__ds_ns.LogoMarquee = __ds_scope.LogoMarquee;

__ds_ns.ReferralRow = __ds_scope.ReferralRow;

__ds_ns.SiteFooter = __ds_scope.SiteFooter;

__ds_ns.SiteNav = __ds_scope.SiteNav;

__ds_ns.TailoredResumeCard = __ds_scope.TailoredResumeCard;

__ds_ns.TestimonialCard = __ds_scope.TestimonialCard;

})();
