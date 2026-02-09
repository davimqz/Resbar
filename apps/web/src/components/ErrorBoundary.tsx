import React from 'react';

type Props = { children: React.ReactNode; fallback?: React.ReactNode };

type State = { hasError: boolean };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: unknown, _info: unknown) {
    // Optional: send to logging service
    // console.error('ErrorBoundary caught', _error, _info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-100 rounded p-4 text-red-700">
          {this.props.fallback ?? <div>Ocorreu um erro ao carregar este componente.</div>}
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
