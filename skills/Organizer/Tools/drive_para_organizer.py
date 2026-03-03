#!/usr/bin/env python3
"""
Google Drive PARA Organizer
Organise un Google Drive selon le framework PARA (Projects, Areas, Resources, Archives)
"""

import os
import sys
import json
import time
import io
from datetime import datetime, timezone
from google.auth.transport.requests import Request
try:
    from PyPDF2 import PdfReader
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Scopes nécessaires pour lire et modifier les fichiers/dossiers
SCOPES = ['https://www.googleapis.com/auth/drive']

# Dossier à exclure de la réorganisation (vide = tout inclure)
EXCLUDED_FOLDER_IDS = []

# Structure PARA
PARA_FOLDERS = {
    '1-Projects': 'Projets actifs avec deadline/objectif clair',
    '2-Areas': 'Domaines de responsabilité continue (sans deadline)',
    '3-Resources': 'Sujets d\'intérêt, références, documentation',
    '4-Archives': 'Éléments inactifs des catégories précédentes'
}

# Types Google exportables en texte
GOOGLE_EXPORTABLE_TYPES = {
    'application/vnd.google-apps.document': 'text/plain',
    'application/vnd.google-apps.spreadsheet': 'text/csv',
    'application/vnd.google-apps.presentation': 'text/plain',
}

# Types de fichiers texte téléchargeables
TEXT_FILE_EXTENSIONS = ['md', 'txt', 'json', 'csv', 'xml', 'html', 'yml', 'yaml']

class DriveParaOrganizer:
    def __init__(self):
        self.creds = None
        self.service = None
        self.para_folder_ids = {}

    def authenticate(self):
        """Authentification OAuth2 avec Google Drive"""
        token_path = 'token.json'
        creds_path = 'credentials.json'

        if os.path.exists(token_path):
            self.creds = Credentials.from_authorized_user_file(token_path, SCOPES)

        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                self.creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(creds_path, SCOPES)
                self.creds = flow.run_local_server(port=8080, access_type='offline', prompt='consent')

            with open(token_path, 'w') as token:
                token.write(self.creds.to_json())

        self.service = build('drive', 'v3', credentials=self.creds)
        print("✓ Authentification réussie!")
        return True

    def get_folder_structure(self, parent_id='root', depth=0, max_depth=5):
        """Récupère la structure des dossiers du Drive"""
        if depth > max_depth:
            return []

        try:
            query = f"'{parent_id}' in parents and trashed = false"
            results = self.service.files().list(
                q=query,
                pageSize=1000,
                fields="nextPageToken, files(id, name, mimeType, parents, modifiedTime)"
            ).execute()

            items = results.get('files', [])
            structure = []

            for item in items:
                if item['id'] in EXCLUDED_FOLDER_IDS:
                    continue

                entry = {
                    'id': item['id'],
                    'name': item['name'],
                    'type': 'folder' if item['mimeType'] == 'application/vnd.google-apps.folder' else 'file',
                    'mimeType': item['mimeType'],
                    'modifiedTime': item.get('modifiedTime', ''),
                    'depth': depth,
                    'children': []
                }

                if entry['type'] == 'folder':
                    entry['children'] = self.get_folder_structure(item['id'], depth + 1, max_depth)

                structure.append(entry)

            return structure

        except HttpError as error:
            print(f"Erreur API: {error}")
            return []

    def print_structure(self, structure, indent=0):
        """Affiche la structure du Drive de manière lisible"""
        for item in structure:
            prefix = "  " * indent
            icon = "📁" if item['type'] == 'folder' else "📄"
            print(f"{prefix}{icon} {item['name']}")
            if item['children']:
                self.print_structure(item['children'], indent + 1)

    def get_root_items(self):
        """Récupère uniquement les éléments à la racine du Drive"""
        try:
            query = "'root' in parents and trashed = false"
            results = self.service.files().list(
                q=query,
                pageSize=1000,
                fields="files(id, name, mimeType, modifiedTime)"
            ).execute()

            items = []
            for item in results.get('files', []):
                if item['id'] not in EXCLUDED_FOLDER_IDS:
                    items.append({
                        'id': item['id'],
                        'name': item['name'],
                        'type': 'folder' if item['mimeType'] == 'application/vnd.google-apps.folder' else 'file',
                        'mimeType': item['mimeType'],
                        'modifiedTime': item.get('modifiedTime', '')
                    })

            return items

        except HttpError as error:
            print(f"Erreur API: {error}")
            return []

    def get_enhanced_root_items(self):
        """Récupère les éléments à la racine avec métadonnées enrichies"""
        try:
            query = "'root' in parents and trashed = false"
            results = self.service.files().list(
                q=query,
                pageSize=1000,
                fields="files(id, name, mimeType, modifiedTime, createdTime, description, starred, size, fileExtension, viewedByMeTime, webViewLink)"
            ).execute()

            items = []
            for item in results.get('files', []):
                if item['id'] not in EXCLUDED_FOLDER_IDS:
                    items.append({
                        'id': item['id'],
                        'name': item['name'],
                        'type': 'folder' if item['mimeType'] == 'application/vnd.google-apps.folder' else 'file',
                        'mimeType': item['mimeType'],
                        'modifiedTime': item.get('modifiedTime', ''),
                        'createdTime': item.get('createdTime', ''),
                        'description': item.get('description', ''),
                        'starred': item.get('starred', False),
                        'size': item.get('size'),
                        'fileExtension': item.get('fileExtension', ''),
                        'viewedByMeTime': item.get('viewedByMeTime', ''),
                        'webViewLink': item.get('webViewLink', '')
                    })

            return items

        except HttpError as error:
            print(f"Erreur API: {error}")
            return []

    def export_google_doc_content(self, file_id, mime_type, max_chars=500):
        """Exporte le contenu d'un fichier Google natif (Docs, Sheets, Slides)"""
        export_mime = GOOGLE_EXPORTABLE_TYPES.get(mime_type)
        if not export_mime:
            return None

        try:
            request = self.service.files().export(
                fileId=file_id,
                mimeType=export_mime
            )
            content = request.execute()

            if isinstance(content, bytes):
                content = content.decode('utf-8', errors='replace')

            # Nettoyer et tronquer
            content = ' '.join(content.split())[:max_chars]
            if len(content) == max_chars:
                content += '...'

            return content

        except HttpError as error:
            return None
        except Exception:
            return None

    def extract_pdf_content(self, file_id, max_chars=500):
        """Télécharge et extrait le texte d'un PDF"""
        if not PDF_SUPPORT:
            return None

        try:
            # Télécharger le contenu du PDF
            request = self.service.files().get_media(fileId=file_id)
            content = request.execute()

            # Lire avec PyPDF2
            pdf_file = io.BytesIO(content)
            reader = PdfReader(pdf_file)

            text_parts = []
            chars_collected = 0

            for page in reader.pages:
                if chars_collected >= max_chars:
                    break
                page_text = page.extract_text() or ''
                text_parts.append(page_text)
                chars_collected += len(page_text)

            full_text = ' '.join(text_parts)
            # Nettoyer et tronquer
            full_text = ' '.join(full_text.split())[:max_chars]
            if len(full_text) == max_chars:
                full_text += '...'

            return full_text if full_text.strip() else None

        except Exception:
            return None

    def extract_text_file_content(self, file_id, max_chars=500):
        """Télécharge et extrait le texte d'un fichier texte (.md, .txt, .json, etc.)"""
        try:
            request = self.service.files().get_media(fileId=file_id)
            content = request.execute()

            # Décoder en texte
            if isinstance(content, bytes):
                text = content.decode('utf-8', errors='replace')
            else:
                text = str(content)

            # Nettoyer et tronquer
            text = ' '.join(text.split())[:max_chars]
            if len(text) == max_chars:
                text += '...'

            return text if text.strip() else None

        except Exception:
            return None

    def calculate_file_age_category(self, created_time_str, modified_time_str, viewed_time_str=None):
        """Calcule la catégorie d'âge d'un fichier"""
        now = datetime.now(timezone.utc)

        result = {
            'age_days': None,
            'age_category': 'unknown',
            'last_activity_days': None,
            'last_viewed_days': None
        }

        try:
            if created_time_str:
                created = datetime.fromisoformat(created_time_str.replace('Z', '+00:00'))
                result['age_days'] = (now - created).days

                if result['age_days'] > 730:  # > 2 ans
                    result['age_category'] = 'old'
                elif result['age_days'] > 365:  # > 1 an
                    result['age_category'] = 'mature'
                elif result['age_days'] > 90:  # > 3 mois
                    result['age_category'] = 'recent'
                else:
                    result['age_category'] = 'new'

            if modified_time_str:
                modified = datetime.fromisoformat(modified_time_str.replace('Z', '+00:00'))
                result['last_activity_days'] = (now - modified).days

            if viewed_time_str:
                viewed = datetime.fromisoformat(viewed_time_str.replace('Z', '+00:00'))
                result['last_viewed_days'] = (now - viewed).days

        except (ValueError, TypeError):
            pass

        return result

    def build_classification_hints(self, item):
        """Génère des signaux de classification automatiques"""
        signals = []
        suggested = None

        # Fichier favori = actif
        if item.get('starred'):
            signals.append('STARRED: Fichier favori, probablement actif')
            suggested = '1-Projects'

        # Analyse de l'âge
        age_info = self.calculate_file_age_category(
            item.get('createdTime'),
            item.get('modifiedTime'),
            item.get('viewedByMeTime')
        )

        if age_info['age_category'] == 'old':
            signals.append(f"OLD: Créé il y a {age_info['age_days']} jours")
            if not suggested:
                suggested = '4-Archives'

        if age_info['last_activity_days'] and age_info['last_activity_days'] > 365:
            signals.append(f"INACTIVE: Non modifié depuis {age_info['last_activity_days']} jours")
            if not suggested:
                suggested = '4-Archives'

        if age_info['last_viewed_days'] and age_info['last_viewed_days'] > 365:
            signals.append(f"NOT_VIEWED: Non consulté depuis {age_info['last_viewed_days']} jours")
            if not suggested:
                suggested = '4-Archives'

        # Patterns basés sur le nom
        name_lower = item['name'].lower()
        ext = item.get('fileExtension', '').lower()

        # Patterns financiers
        financial_keywords = ['facture', 'invoice', 'statement', 'releve', 'relevé', 'bank', 'banque', 'budget']
        if any(kw in name_lower for kw in financial_keywords):
            signals.append('FINANCIAL: Document financier détecté')
            if not suggested:
                suggested = '2-Areas'

        # Patterns ressources
        resource_keywords = ['book', 'guide', 'manual', 'tutorial', 'template', 'reference', 'cours', 'formation']
        if any(kw in name_lower for kw in resource_keywords):
            signals.append('RESOURCE: Matériel de référence/apprentissage')
            if not suggested:
                suggested = '3-Resources'

        return {
            'signals': signals,
            'suggested_category': suggested,
            'age_info': age_info
        }

    def get_folder_contents_summary(self, folder_id, max_children=20, max_previews=3):
        """Récupère un résumé du contenu d'un dossier"""
        try:
            query = f"'{folder_id}' in parents and trashed = false"
            results = self.service.files().list(
                q=query,
                pageSize=100,
                fields="files(id, name, mimeType, modifiedTime, createdTime, viewedByMeTime)"
            ).execute()

            children = results.get('files', [])
            children_count = len(children)

            # Liste des noms (max_children premiers)
            children_summary = [c['name'] for c in children[:max_children]]
            if children_count > max_children:
                children_summary.append(f"... et {children_count - max_children} autres")

            # Date d'activité la plus récente
            most_recent = None
            for child in children:
                mod_time = child.get('modifiedTime', '')
                if mod_time and (not most_recent or mod_time > most_recent):
                    most_recent = mod_time

            # Previews de contenu pour les Google Docs, PDFs et fichiers texte
            content_previews = []
            preview_count = 0
            for child in children:
                if preview_count >= max_previews:
                    break
                preview = None
                # Google Docs natifs
                if child['mimeType'] in GOOGLE_EXPORTABLE_TYPES:
                    preview = self.export_google_doc_content(child['id'], child['mimeType'], 300)
                # PDFs
                elif child['mimeType'] == 'application/pdf':
                    preview = self.extract_pdf_content(child['id'], 300)
                # Fichiers texte (.md, .txt, .json, etc.)
                else:
                    ext = child['name'].rsplit('.', 1)[-1].lower() if '.' in child['name'] else ''
                    if ext in TEXT_FILE_EXTENSIONS:
                        preview = self.extract_text_file_content(child['id'], 300)
                if preview:
                    content_previews.append(f"{child['name']}: {preview}")
                    preview_count += 1
                time.sleep(0.1)  # Rate limiting

            return {
                'children_count': children_count,
                'children_summary': children_summary,
                'most_recent_activity': most_recent,
                'content_previews': content_previews
            }

        except HttpError as error:
            print(f"  Erreur lors de l'analyse du dossier: {error}")
            return {
                'children_count': 0,
                'children_summary': [],
                'most_recent_activity': None,
                'content_previews': []
            }

    def create_para_folders(self):
        """Crée les 4 dossiers PARA s'ils n'existent pas"""
        print("\n📂 Création/vérification des dossiers PARA...")

        for folder_name, description in PARA_FOLDERS.items():
            # Vérifie si le dossier existe déjà
            query = f"name = '{folder_name}' and 'root' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
            results = self.service.files().list(q=query, fields="files(id, name)").execute()
            files = results.get('files', [])

            if files:
                self.para_folder_ids[folder_name] = files[0]['id']
                print(f"  ✓ {folder_name} existe déjà")
            else:
                # Crée le dossier
                file_metadata = {
                    'name': folder_name,
                    'mimeType': 'application/vnd.google-apps.folder',
                    'description': description
                }
                folder = self.service.files().create(body=file_metadata, fields='id').execute()
                self.para_folder_ids[folder_name] = folder.get('id')
                print(f"  ✓ {folder_name} créé")

        return self.para_folder_ids

    def move_item(self, item_id, new_parent_id):
        """Déplace un élément vers un nouveau dossier parent"""
        try:
            # Récupère les parents actuels
            file = self.service.files().get(fileId=item_id, fields='parents').execute()
            previous_parents = ",".join(file.get('parents', []))

            # Déplace vers le nouveau parent
            self.service.files().update(
                fileId=item_id,
                addParents=new_parent_id,
                removeParents=previous_parents,
                fields='id, parents'
            ).execute()

            return True
        except HttpError as error:
            print(f"Erreur lors du déplacement: {error}")
            return False

    def analyze_and_propose_mapping(self, items):
        """Analyse les éléments et propose un mapping PARA"""
        mapping = []

        for item in items:
            # Ignore les dossiers PARA existants
            if item['name'] in PARA_FOLDERS:
                continue

            # Proposition basique basée sur le nom et le type
            suggestion = self.suggest_para_category(item)

            mapping.append({
                'item': item,
                'suggested_category': suggestion,
                'reason': self.get_suggestion_reason(item, suggestion)
            })

        return mapping

    def suggest_para_category(self, item):
        """Suggère une catégorie PARA pour un élément"""
        name_lower = item['name'].lower()

        # PROJETS ACTIFS SPÉCIFIQUES (définis par l'utilisateur)
        active_projects = ['goodreads quotes', 'md test', 'transcripts']
        for project in active_projects:
            if project in name_lower:
                return '1-Projects'

        # Patterns pour Archives (AVANT les autres catégories)
        # Fichiers "Untitled", anciens (2020-2023), copies, résultats orphelins
        archive_keywords = ['untitled', 'archive', 'old', 'ancien', '2020', '2021', '2022', '2023', 'backup', 'copy of']
        for keyword in archive_keywords:
            if keyword in name_lower:
                return '4-Archives'

        # Fichiers result/test orphelins → Archives
        if name_lower.startswith('result') or (name_lower == 'test' or name_lower.startswith('test.')):
            return '4-Archives'

        # Patterns pour Areas (domaines de responsabilité continue)
        # Finance, Admin, Factures, Relevés bancaires
        area_keywords = ['facture', 'invoice', 'releve', 'relevé', 'acctstmt', 'bank', 'banque',
                        'transaction', 'stoic', 'nolk', 'admin', 'finance', 'rh', 'hr',
                        'marketing', 'legal', 'juridique', 'comptabilité', 'management',
                        'crm', 'tracking', 'process', 'linkedin', 'substack', 'shopify', 'order']
        for keyword in area_keywords:
            if keyword in name_lower:
                return '2-Areas'

        # Patterns pour Resources (références, templates, documentation)
        resource_keywords = ['template', 'modèle', 'guide', 'documentation', 'formation',
                           'tutoriel', 'référence', 'ressource', 'tao', 'chapter', 'chapitre',
                           'preface', 'contents', 'book']
        for keyword in resource_keywords:
            if keyword in name_lower:
                return '3-Resources'

        # Par défaut → Resources
        return '3-Resources'

    def get_suggestion_reason(self, item, category):
        """Explique pourquoi cette catégorie est suggérée"""
        reasons = {
            '1-Projects': "Semble être un projet actif",
            '2-Areas': "Domaine de responsabilité continue",
            '3-Resources': "Ressource ou référence",
            '4-Archives': "Élément ancien ou archivé"
        }
        return reasons.get(category, "Catégorie par défaut")

    def print_mapping_proposal(self, mapping):
        """Affiche la proposition de mapping pour validation"""
        print("\n" + "="*60)
        print("PROPOSITION DE MAPPING PARA")
        print("="*60)

        for category in PARA_FOLDERS.keys():
            items_in_category = [m for m in mapping if m['suggested_category'] == category]
            if items_in_category:
                print(f"\n📁 {category}:")
                for m in items_in_category:
                    icon = "📁" if m['item']['type'] == 'folder' else "📄"
                    print(f"   {icon} {m['item']['name']}")

        print("\n" + "="*60)
        return mapping

    def execute_migration(self, mapping):
        """Exécute la migration après validation"""
        print("\n🚀 Exécution de la migration...")

        success_count = 0
        error_count = 0

        for m in mapping:
            category = m['suggested_category']
            item = m['item']
            target_folder_id = self.para_folder_ids.get(category)

            if target_folder_id:
                icon = "📁" if item['type'] == 'folder' else "📄"
                print(f"  Déplacement de {icon} {item['name']} → {category}...", end=" ")

                if self.move_item(item['id'], target_folder_id):
                    print("✓")
                    success_count += 1
                else:
                    print("✗")
                    error_count += 1

        print(f"\n✅ Migration terminée: {success_count} succès, {error_count} erreurs")
        return success_count, error_count


def main():
    """Fonction principale"""
    # Analyse des arguments
    mode = 'analyze'  # Par défaut : analyse seule
    if len(sys.argv) > 1:
        mode = sys.argv[1].lower()

    print("="*60)
    print("GOOGLE DRIVE PARA ORGANIZER")
    print(f"Mode: {mode}")
    print("="*60)

    organizer = DriveParaOrganizer()

    # Mode EXPORT : génère un JSON enrichi pour classification par Claude
    if mode == 'export':
        print("\n📌 Mode EXPORT - Génération du fichier enrichi pour Claude")
        if not organizer.authenticate():
            print("Échec de l'authentification")
            return

        print("Récupération des éléments avec métadonnées enrichies...")
        root_items = organizer.get_enhanced_root_items()

        # Filtrer les dossiers PARA existants
        items_to_classify = [
            item for item in root_items
            if item['name'] not in PARA_FOLDERS
        ]

        print(f"\n{len(items_to_classify)} éléments à classifier")
        print("Enrichissement des données (contenu, analyse des dossiers)...")

        enriched_items = []
        for i, item in enumerate(items_to_classify):
            print(f"  [{i+1}/{len(items_to_classify)}] {item['name'][:50]}...", end=" ")

            enriched = item.copy()

            # Pour les fichiers Google natifs : extraire le contenu
            if item['type'] == 'file' and item['mimeType'] in GOOGLE_EXPORTABLE_TYPES:
                enriched['content_preview'] = organizer.export_google_doc_content(
                    item['id'], item['mimeType'], 500
                )
                print("(Google Doc)", end=" ")
            # Pour les PDFs : télécharger et extraire
            elif item['type'] == 'file' and item['mimeType'] == 'application/pdf':
                enriched['content_preview'] = organizer.extract_pdf_content(item['id'], 500)
                if enriched['content_preview']:
                    print("(PDF)", end=" ")
                else:
                    print("(PDF non lisible)", end=" ")
            # Pour les fichiers texte (.md, .txt, .json, etc.)
            elif item['type'] == 'file' and item.get('fileExtension', '').lower() in TEXT_FILE_EXTENSIONS:
                enriched['content_preview'] = organizer.extract_text_file_content(item['id'], 500)
                if enriched['content_preview']:
                    print(f"(.{item.get('fileExtension', '')})", end=" ")
                else:
                    print(f"(.{item.get('fileExtension', '')} vide)", end=" ")
            else:
                enriched['content_preview'] = None

            # Pour les dossiers : analyser le contenu
            if item['type'] == 'folder':
                folder_summary = organizer.get_folder_contents_summary(item['id'])
                enriched['children_count'] = folder_summary['children_count']
                enriched['children_summary'] = folder_summary['children_summary']
                enriched['most_recent_activity'] = folder_summary['most_recent_activity']
                enriched['content_previews'] = folder_summary['content_previews']
                print(f"(dossier: {folder_summary['children_count']} éléments)", end=" ")

            # Générer les hints de classification
            enriched['classification_hints'] = organizer.build_classification_hints(item)

            enriched_items.append(enriched)
            print("✓")
            time.sleep(0.05)  # Rate limiting léger

        export_data = {
            'export_timestamp': datetime.now(timezone.utc).isoformat(),
            'total_items': len(enriched_items),
            'instructions': '''Classifie chaque élément dans UNE catégorie PARA.

CATÉGORIES:
- 1-Projects: Projets ACTIFS avec deadline/objectif clair
- 2-Areas: Domaines de responsabilité CONTINUE (finance, admin, santé, carrière)
- 3-Resources: Références, templates, documentation, apprentissage
- 4-Archives: Éléments INACTIFS, anciens, ou terminés

RÈGLES IMPORTANTES:
1. DOSSIERS: Classifier le dossier ENTIER, pas son contenu individuel
2. FICHIERS LIÉS: Si plusieurs fichiers à la racine parlent du même sujet,
   les GROUPER dans un nouveau dossier (utiliser "group" dans la classification)
3. Ne PAS séparer des fichiers qui font partie d'un même projet/thème

SIGNAUX À CONSIDÉRER:
- STARRED = probablement actif (Projects ou Areas)
- OLD + INACTIVE + NOT_VIEWED = Archives
- Contenu financier (factures, relevés) = Areas
- Matériel d'apprentissage (livres, guides) = Resources

FORMAT DE RÉPONSE:
- Pour un dossier existant: {"id": "...", "name": "...", "type": "folder", "category": "1-Projects"}
- Pour des fichiers à grouper: {"group": "Nom du nouveau dossier", "category": "1-Projects", "files": ["id1", "id2", ...]}
- Pour un fichier isolé: {"id": "...", "name": "...", "type": "file", "category": "3-Resources"}''',
            'categories': {
                '1-Projects': 'Projets actifs avec deadline/objectif clair',
                '2-Areas': 'Domaines de responsabilité continue (finance, admin, santé)',
                '3-Resources': 'Références, templates, documentation, apprentissage',
                '4-Archives': 'Éléments inactifs, anciens, ou terminés'
            },
            'items': enriched_items
        }

        output_file = 'files_to_classify.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)

        print(f"\n✅ {len(enriched_items)} éléments exportés vers {output_file}")
        print("\n📋 Prochaine étape:")
        print("   1. Montrez le contenu de files_to_classify.json à Claude")
        print("   2. Demandez-lui de classifier et générer classification.json")
        print("   3. Lancez: python3 drive_para_organizer.py import")
        return

    # Mode IMPORT : lit le JSON de classification et exécute
    if mode == 'import':
        import_file = sys.argv[2] if len(sys.argv) > 2 else 'classification.json'
        print(f"\n📌 Mode IMPORT - Lecture de {import_file}")

        if not os.path.exists(import_file):
            print(f"❌ Fichier {import_file} introuvable")
            return

        with open(import_file, 'r', encoding='utf-8') as f:
            classifications = json.load(f)

        if not organizer.authenticate():
            print("Échec de l'authentification")
            return

        # Créer les dossiers PARA si nécessaire
        organizer.create_para_folders()

        # Exécuter les déplacements
        print("\n🚀 Exécution des déplacements...")
        success_count = 0
        error_count = 0
        group_count = 0

        for item in classifications.get('classifications', []):
            # Cas 1: Groupement de fichiers dans un nouveau dossier
            if 'group' in item:
                group_name = item['group']
                category = item['category']
                file_ids = item.get('files', [])
                target_folder_id = organizer.para_folder_ids.get(category)

                if target_folder_id and file_ids:
                    print(f"\n  📁 Création du groupe '{group_name}' dans {category}...")

                    # Créer le sous-dossier dans la catégorie PARA
                    folder_metadata = {
                        'name': group_name,
                        'mimeType': 'application/vnd.google-apps.folder',
                        'parents': [target_folder_id]
                    }
                    try:
                        new_folder = organizer.service.files().create(
                            body=folder_metadata, fields='id'
                        ).execute()
                        new_folder_id = new_folder.get('id')
                        print(f"     Dossier créé ✓")
                        group_count += 1

                        # Déplacer les fichiers dans ce nouveau dossier
                        for file_id in file_ids:
                            if organizer.move_item(file_id, new_folder_id):
                                print(f"     📄 Fichier déplacé ✓")
                                success_count += 1
                            else:
                                print(f"     📄 Fichier déplacé ✗")
                                error_count += 1
                    except Exception as e:
                        print(f"     Erreur création dossier: {e}")
                        error_count += 1
                continue

            # Cas 2: Élément individuel (fichier ou dossier existant)
            item_id = item.get('id')
            item_name = item.get('name', 'Inconnu')
            category = item.get('category')
            target_folder_id = organizer.para_folder_ids.get(category)

            if target_folder_id and item_id:
                icon = "📁" if item.get('type') == 'folder' else "📄"
                print(f"  {icon} {item_name} → {category}...", end=" ")

                if organizer.move_item(item_id, target_folder_id):
                    print("✓")
                    success_count += 1
                else:
                    print("✗")
                    error_count += 1

        print(f"\n✅ Migration terminée: {success_count} succès, {error_count} erreurs")
        if group_count > 0:
            print(f"   {group_count} groupe(s) créé(s)")
        return

    # Modes existants (analyze/migrate)
    print("\n📌 Étape 1: Authentification")
    if not organizer.authenticate():
        print("Échec de l'authentification")
        return

    print("\n📌 Étape 2: Analyse de la structure actuelle")
    print("Récupération des éléments à la racine du Drive...")
    root_items = organizer.get_root_items()

    if not root_items:
        print("Aucun élément trouvé à la racine du Drive")
        return

    print(f"\n{len(root_items)} éléments trouvés à la racine:")
    for item in root_items:
        icon = "📁" if item['type'] == 'folder' else "📄"
        print(f"  {icon} {item['name']}")

    print("\n📌 Étape 3: Création/vérification des dossiers PARA")
    organizer.create_para_folders()

    print("\n📌 Étape 4: Proposition de mapping")
    mapping = organizer.analyze_and_propose_mapping(root_items)
    organizer.print_mapping_proposal(mapping)

    if mode == 'migrate':
        print("\n📌 Étape 5: Exécution de la migration")
        organizer.execute_migration(mapping)
    else:
        print("\n💡 Commandes disponibles:")
        print("   python3 drive_para_organizer.py export   → Exporter pour classification Claude")
        print("   python3 drive_para_organizer.py import   → Importer et exécuter classification")
        print("   python3 drive_para_organizer.py migrate  → Migration avec règles basiques")


if __name__ == '__main__':
    main()
