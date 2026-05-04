#!/usr/bin/env python3
"""
Extrai metadata + produtos das 7 lojas legacy e gera SQL de seed
para popular jebai_stores + jebai_store_products no Supabase.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# Lê dos arquivos originais (preservados na pasta backup) e gera o seed na raiz atual
SOURCE = ROOT.parent / "jebai-dashboard-pronto - Copia"
OUT = ROOT / "seed-lojas-legacy.sql"

# slug -> arquivo
LOJAS = {
    "atacado-connect": "loja-atacado-connect.html",
    "atlantico": "loja-atlantico.html",
    "best-shop": "loja-best-shop.html",
    "bestfit": "loja-bestfit.html",
    "dior": "loja-dior.html",
    "oneclick": "loja-oneclick.html",
    "usa": "loja-usa.html",
}

# E-mail do owner — usa a conta que você usa pra logar
DEFAULT_OWNER = "abraaosecundaria@hotmail.com"


def sql_str(s):
    if s is None:
        return "NULL"
    return "'" + s.replace("'", "''") + "'"


def extract_store(html, slug):
    """Extrai nome, descrição, cor, tags do header da loja."""
    cor = re.search(r"--brand:\s*(#[0-9a-fA-F]{3,6})", html)
    nome_match = re.search(r"<h1>([^<]+)</h1>", html)
    desc_match = re.search(r"<h1>[^<]+</h1>\s*<p>([^<]+)</p>", html)
    tags = re.findall(r'<span class="tag">([^<]+)</span>', html)

    return {
        "slug": slug,
        "nome": (nome_match.group(1).strip() if nome_match else slug.title()),
        "descricao": (desc_match.group(1).strip() if desc_match else None),
        "cor_principal": (cor.group(1).upper() if cor else "#1A5276"),
        "tags": tags[:8],
    }


def extract_products(html):
    """Extrai produto por produto (nome, descrição, preço)."""
    # Cada bloco de produto começa com <div class="product-card"> e tem
    # <div class="product-name">…</div>, <div class="product-desc">…</div>,
    # <div class="product-price">…<small>…</small></div>
    cards = re.findall(
        r'<div class="product-card">.*?</div>\s*</div>', html, flags=re.DOTALL
    )
    produtos = []
    for i, card in enumerate(cards):
        nm = re.search(r'<div class="product-name">([^<]+)</div>', card)
        if not nm:
            continue
        ds = re.search(r'<div class="product-desc">([^<]*)</div>', card)
        # preço: pega o conteúdo do product-price, removendo a tag <small>
        pr = re.search(
            r'<div class="product-price">([^<]+)(?:<small>([^<]*)</small>)?',
            card,
        )
        preco = None
        if pr:
            principal = pr.group(1).strip()
            small = (pr.group(2) or "").strip()
            preco = principal + (" — " + small if small else "")
        produtos.append({
            "nome": nm.group(1).strip(),
            "descricao": ds.group(1).strip() if ds else None,
            "preco": preco,
            "ordem": i,
        })
    return produtos


def main():
    out = []
    out.append("-- =============================================================")
    out.append("-- Seed de lojas legacy migradas para jebai_stores/_products")
    out.append("-- Gerado por scripts/extract-lojas-seed.py")
    out.append("-- =============================================================")
    out.append("-- IMPORTANTE: ajuste o owner_email abaixo se quiser que")
    out.append("-- alguém específico (não-admin) seja dono.")
    out.append("-- Idempotente: pode rodar múltiplas vezes (UPSERT por slug).")
    out.append("-- =============================================================")
    out.append("")
    out.append("BEGIN;")
    out.append("")

    for slug, filename in LOJAS.items():
        path = SOURCE / filename
        if not path.exists():
            out.append(f"-- skip: {filename} não encontrado em {SOURCE}")
            continue
        html = path.read_text(encoding="utf-8", errors="replace")
        store = extract_store(html, slug)
        produtos = extract_products(html)

        out.append(f"-- ----- Loja: {store['nome']} ({slug}) — {len(produtos)} produtos -----")

        # 1. Apaga produtos legados da loja (se existir)
        out.append(
            "DELETE FROM public.jebai_store_products "
            f"WHERE store_id IN (SELECT id FROM public.jebai_stores WHERE slug = {sql_str(slug)}) "
            "AND origem = 'legacy_seed';"
        )

        # 2. Apaga a loja anterior com este slug (idempotente, sem depender de UNIQUE)
        out.append(
            f"DELETE FROM public.jebai_stores WHERE slug = {sql_str(slug)};"
        )

        # 3. Insere a loja zerada
        out.append(
            "INSERT INTO public.jebai_stores "
            "(slug, owner_email, nome, descricao, cor_principal, status) VALUES ("
            f"{sql_str(slug)}, "
            f"{sql_str(DEFAULT_OWNER)}, "
            f"{sql_str(store['nome'])}, "
            f"{sql_str(store['descricao'])}, "
            f"{sql_str(store['cor_principal'])}, "
            "'published');"
        )

        for p in produtos:
            out.append(
                "INSERT INTO public.jebai_store_products "
                "(store_id, nome, descricao, preco, ordem, origem) "
                f"SELECT id, {sql_str(p['nome'])}, {sql_str(p['descricao'])}, "
                f"{sql_str(p['preco'])}, {p['ordem']}, 'legacy_seed' "
                f"FROM public.jebai_stores WHERE slug = {sql_str(slug)};"
            )

        out.append("")

    out.append("COMMIT;")
    out.append("")
    out.append(f"-- {len(LOJAS)} lojas processadas.")

    OUT.write_text("\n".join(out), encoding="utf-8")
    print(f"Gerado: {OUT}")
    print(f"Lojas: {len(LOJAS)}")


if __name__ == "__main__":
    main()
