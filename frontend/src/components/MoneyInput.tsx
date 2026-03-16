import { useState, useEffect, useRef } from 'react'

interface Props {
  value: number
  onChange: (v: number) => void
  className?: string
  placeholder?: string
}

export default function MoneyInput({ value, onChange, className = '', placeholder }: Props) {
  const [display, setDisplay] = useState(value ? value.toLocaleString() : '')
  const isFocused = useRef(false)

  useEffect(() => {
    if (!isFocused.current) {
      setDisplay(value ? value.toLocaleString() : '')
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '')
    if (raw === '' || raw === '-') {
      setDisplay(raw)
      onChange(0)
      return
    }
    const num = Number(raw)
    if (!isNaN(num)) {
      setDisplay(num.toLocaleString())
      onChange(num)
    }
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onFocus={() => { isFocused.current = true }}
      onBlur={() => { isFocused.current = false; setDisplay(value ? value.toLocaleString() : '') }}
      placeholder={placeholder}
      className={`border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${className}`}
    />
  )
}
