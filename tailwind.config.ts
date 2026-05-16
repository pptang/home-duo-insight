
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				display: ['DM Serif Display', 'Georgia', 'serif'],
				body: ['Noto Sans JP', 'sans-serif'],
				mono: ['DM Mono', 'monospace'],
				inter: ['Noto Sans JP', 'sans-serif'],
				aisumai: ['Noto Sans JP', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				paper: {
					DEFAULT: '#f9f8f5',
					dark: '#f0ede6',
				},
				ink: {
					DEFAULT: '#0a0a0a',
					80: 'rgba(10,10,10,0.82)',
					60: 'rgba(10,10,10,0.6)',
					30: 'rgba(10,10,10,0.3)',
					10: 'rgba(10,10,10,0.08)',
				},
				rule: 'rgba(10,10,10,0.12)',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				'risk-low': '#4a7c59',
				'risk-med': '#c4942a',
				'risk-high': '#b04040'
			},
			boxShadow: {
				card: '0 1px 2px rgba(10,10,10,0.04), 0 1px 3px rgba(10,10,10,0.06)',
				widget: '0 4px 12px rgba(10,10,10,0.08)',
				drawer: '0 -4px 24px rgba(10,10,10,0.12)'
			},
			transitionDuration: {
				fast: '150ms',
				normal: '200ms',
				slow: '300ms'
			},
			transitionTimingFunction: {
				spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					from: { 
						opacity: '0',
						transform: 'translateY(10px)'
					},
					to: { 
						opacity: '1',
						transform: 'translateY(0)'
					},
				},
				'slide-in': {
					from: {
						transform: 'translateX(-20px)',
						opacity: '0'
					},
					to: {
						transform: 'translateX(0)',
						opacity: '1'
					}
				},
				'bar-fill': {
					from: { width: '0%' },
					to: { width: 'var(--bar-target, 100%)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-in': 'slide-in 0.4s ease-out',
				'bar-fill': 'bar-fill 800ms cubic-bezier(0.34, 1.56, 0.64, 1) both'
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
