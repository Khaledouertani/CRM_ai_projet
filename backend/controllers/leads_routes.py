from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pandas as pd
import io
import pymysql
import json

router = APIRouter(prefix="/api/leads", tags=["leads"])

def get_db():
    return pymysql.connect(
        host='localhost', user='root', password='',
        database='pfe_crm_ia', cursorclass=pymysql.cursors.DictCursor
    )

@router.post("/import")
async def import_leads(
    file: UploadFile = File(...),
    campaign_name: str = Form("Campagne par défaut"),
    company_name: str = Form("Autre")
):
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Format de fichier non supporté")
    
    contents = await file.read()
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors de la lecture du fichier: {str(e)}")

    # Mapping flexible (recherche de colonnes probables)
    cols = df.columns.tolist()
    
    def find_col(possible_names):
        for p in possible_names:
            for c in cols:
                if p.lower() in c.lower():
                    return c
        return None

    col_company = find_col(['societé', 'company', 'entreprise', 'société'])
    col_contact = find_col(['nom', 'contact', 'prenom', 'client'])
    col_phone   = find_col(['tel', 'phone', 'mobile', 'téléphone'])
    col_email   = find_col(['mail', 'email', 'courriel'])
    col_address = find_col(['adresse', 'address', 'ville'])

    conn = get_db()
    imported_count = 0
    
    try:
        with conn.cursor() as cur:
            for _, row in df.iterrows():
                # On ignore si pas de téléphone
                phone = str(row[col_phone]) if col_phone and pd.notna(row[col_phone]) else None
                if not phone:
                    continue
                
                comp = str(row[col_company]) if col_company and pd.notna(row[col_company]) else company_name
                contact = str(row[col_contact]) if col_contact and pd.notna(row[col_contact]) else "Inconnu"
                email = str(row[col_email]) if col_email and pd.notna(row[col_email]) else ""
                address = str(row[col_address]) if col_address and pd.notna(row[col_address]) else ""

                sql = """
                INSERT INTO leads (company_name, contact_name, phone, email, address, campaign_name)
                VALUES (%s, %s, %s, %s, %s, %s)
                """
                cur.execute(sql, (comp, contact, phone, email, address, campaign_name))
                imported_count += 1
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur DB: {str(e)}")
    finally:
        conn.close()

    return {
        "success": True,
        "filename": file.filename,
        "imported": imported_count,
        "campaign": campaign_name
    }

@router.get("/stats")
async def get_leads_stats():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT campaign_name, COUNT(*) as count FROM leads GROUP BY campaign_name")
            campaigns = cur.fetchall()
            
            cur.execute("SELECT status, COUNT(*) as count FROM leads GROUP BY status")
            statuses = cur.fetchall()
            
            cur.execute("SELECT COUNT(*) as total FROM leads")
            total = cur.fetchone()["total"]
            
        return {
            "total": total,
            "campaigns": campaigns,
            "statuses": statuses
        }
    finally:
        conn.close()
@router.get("")
async def get_leads():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, contact_name as name, phone, status, address as postalCode, campaign_name as agent FROM leads ORDER BY id DESC")
            return cur.fetchall()
    finally:
        conn.close()
