// mdast-util-to-hast preserves fence metadata in code.data.meta, not className.
// Its code handler appends one newline to nonempty Markdown code values.
export function getRunnableCode(preNode) {
  const code = preNode?.children?.[0];
  if (code?.tagName !== 'code'
    || !code.properties?.className?.includes('language-python')
    || !code.data?.meta?.split(/\s+/).includes('run')) return null;

  const value = code.children.map((child) => child.value || '').join('');
  return { language: 'python', initialCode: value.replace(/\n$/, '') };
}
