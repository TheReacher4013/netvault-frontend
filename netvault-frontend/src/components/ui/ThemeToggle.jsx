import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle({ size = 16, className = '' }) {
    const { mode, toggleMode, theme } = useTheme()
    const isDark = mode === 'dark'

    return (
        <button
            onClick={toggleMode}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${className}`}
            style={{
                background: `${theme.accent}12`,
                border: `1px solid ${theme.border}`,
                color: theme.accent,
            }}
        >
            <span className="relative block w-4 h-4">
                <Sun
                    size={size}
                    className="absolute inset-0 transition-all duration-300"
                    style={{
                        opacity: isDark ? 0 : 1,
                        transform: isDark ? 'rotate(-90deg) scale(0.5)' : 'rotate(0) scale(1)',
                    }}
                />
                <Moon
                    size={size}
                    className="absolute inset-0 transition-all duration-300"
                    style={{
                        opacity: isDark ? 1 : 0,
                        transform: isDark ? 'rotate(0) scale(1)' : 'rotate(90deg) scale(0.5)',
                    }}
                />
            </span>
        </button>
    )
}