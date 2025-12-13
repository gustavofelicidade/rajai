# Show-Tree para zsh/macOS
# uso:
#   show_tree                # lista a partir de .
#   show_tree path/to/dir    # lista a partir do diretório
#   show_tree . --no-gitignore  # ignora o .gitignore (não consulta)
#   show_tree . > estrutura.txt  # salva em arquivo

show_tree() {
  local path="${1:-.}"
  local flag="${2:-}"
  local use_gitignore=1
  [[ "$flag" = "--no-gitignore" ]] && use_gitignore=0

  # listas de exclusão
  local -a EXCLUDE_DIRS=("node_modules" ".git" ".venv" "cache" ".cache" "__pycache__")
  local -a EXCLUDE_FILES=("package.json" "package-lock.json")

  # resolve raiz do repo (pra usar git check-ignore corretamente)
  local root
  if command -v git >/dev/null 2>&1; then
    root="$(git -C "$path" rev-parse --show-toplevel 2>/dev/null)"
    [[ -z "$root" ]] && root="$(cd "$path" && pwd)"
  else
    root="$(cd "$path" && pwd)"
    use_gitignore=0
  fi

  # helper: testa se base está numa array
  _st_in_array() {
    local needle="$1"; shift
    local x
    for x in "$@"; do [[ "$x" = "$needle" ]] && return 0; done
    return 1
  }

  # helper: testa se item é ignorado pelo .gitignore
  _st_git_ignored() {
    [[ $use_gitignore -eq 1 ]] || return 1
    command -v git >/dev/null 2>&1 || return 1
    git -C "$root" check-ignore -q -- "$1"
  }

  # imprime espaços * 2 * indent
  _st_spaces() {
    local indent="$1"
    printf "%*s" $(( indent * 2 )) ""
  }

  # recursivo
  _show_tree() {
    local dir="$1"
    local indent="$2"

    # glob qualifiers: (D)=inclui dotfiles, (N)=nullglob
    local -a entries
    entries=("$dir"/*(DN) "$dir"/.*(DN))

    # separa dirs e arquivos, ordena por nome
    local -a dirs files
    local e base
    for e in "${entries[@]}"; do
      [[ -e "$e" ]] || continue
      base="${e:t}"
      # pula . e ..
      [[ "$base" = "." || "$base" = ".." ]] && continue

      if [[ -d "$e" ]]; then
        # exclui por nome
        _st_in_array "$base" "${EXCLUDE_DIRS[@]}" && continue
        # .gitignore?
        _st_git_ignored "$e" && continue

        printf "%s📁 %s\n" "$(_st_spaces "$indent")" "$base"
        _show_tree "$e" $(( indent + 1 ))
      else
        # exclui arquivos por nome
        _st_in_array "$base" "${EXCLUDE_FILES[@]}" && continue
        # .gitignore?
        _st_git_ignored "$e" && continue

        printf "%s📄 %s\n" "$(_st_spaces "$indent")" "$base"
      fi
    done
  }

  _show_tree "$(cd "$path" && pwd)" 0
}
