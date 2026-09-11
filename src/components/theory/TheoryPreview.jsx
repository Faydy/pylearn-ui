import { Component, memo } from 'react';
import TheoryContent from './TheoryContent';

class PreviewBoundary extends Component {
  state = { error: null, markdown: this.props.markdown };

  static getDerivedStateFromError(error) { return { error }; }

  static getDerivedStateFromProps(props, state) {
    return props.markdown !== state.markdown ? { error: null, markdown: props.markdown } : null;
  }

  render() {
    if (this.state.error) return <div role="alert" className="rounded-xl border border-hard/25 bg-hard/10 p-4 text-sm text-hard">
      <p className="font-bold">Previzualizarea nu a putut fi afișată.</p>
      <p className="mt-2 break-words">{this.state.error.message || 'Verifică sintaxa Markdown.'}</p>
      <p className="mt-2">Editorul și draftul sunt disponibile. Modifică textul pentru a reîncerca.</p>
    </div>;
    return this.props.children;
  }
}

// Editing/copy feedback outside this component must not rerender runnable editors.
const TheoryPreview = memo(function TheoryPreview({ markdown }) {
  return <PreviewBoundary markdown={markdown}><TheoryContent content={markdown} /></PreviewBoundary>;
});

export default TheoryPreview;
