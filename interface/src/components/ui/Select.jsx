import React from "react";

export const Select = ({ children, value, onValueChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(value);

  React.useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const handleSelect = (newValue) => {
    setSelectedValue(newValue);
    onValueChange(newValue);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (child.type === SelectTrigger) {
          return React.cloneElement(child, {
            isOpen,
            setIsOpen,
            selectedValue,
          });
        }
        if (child.type === SelectContent) {
          return React.cloneElement(child, {
            isOpen,
            onSelect: handleSelect,
          });
        }
        return child;
      })}
    </div>
  );
};

export const SelectTrigger = ({
  children,
  isOpen,
  setIsOpen,
  selectedValue,
}) => (
  <button
    type="button"
    onClick={() => setIsOpen(!isOpen)}
    className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {children}
    <svg
      className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </button>
);

export const SelectValue = ({ placeholder, children }) => {
  const context = React.useContext(SelectContext);
  return (
    <span className="text-sm">
      {context?.selectedValue
        ? React.Children.toArray(children).find(
            (child) => child.props.value === context.selectedValue
          )?.props.children || context.selectedValue
        : placeholder}
    </span>
  );
};

const SelectContext = React.createContext();

export const SelectContent = ({ children, isOpen, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-gray-300 bg-white py-1 shadow-lg">
      <SelectContext.Provider value={{ onSelect }}>
        {children}
      </SelectContext.Provider>
    </div>
  );
};

export const SelectItem = ({ children, value }) => {
  const context = React.useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={() => context.onSelect(value)}
      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
    >
      {children}
    </button>
  );
};
