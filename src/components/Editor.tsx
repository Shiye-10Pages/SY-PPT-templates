type Props = {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}

export function Editor({ value, onChange, disabled }: Props) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      readOnly={disabled}
      spellCheck={false}
      className="h-full w-full resize-none bg-neutral-950 p-6 font-mono text-sm leading-relaxed text-neutral-200 outline-none placeholder:text-neutral-600 read-only:opacity-60"
      placeholder={`# 标题独占封面\n\n副标题或简介，第二行可写。\n\n---\n\n## 区块标题\n# 大段巨字内容\n\n---\n\n> 90%\n用户在第一屏就理解了产品\n\n---\n\n## 三个要点\n- 要点一\n- 要点二\n- 要点三\n`}
    />
  )
}
