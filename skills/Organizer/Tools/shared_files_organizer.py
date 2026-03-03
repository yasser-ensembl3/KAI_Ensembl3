#!/usr/bin/env python3
"""
Shared Files Organizer
Crée des raccourcis vers les fichiers partagés dans la structure PARA
"""

import sys
import json
from datetime import datetime, timezone
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

SCOPES = ['https://www.googleapis.com/auth/drive']

PARA_FOLDERS = ['1-Projects', '2-Areas', '3-Resources', '4-Archives']


class SharedFilesOrganizer:
    def __init__(self):
        self.creds = Credentials.from_authorized_user_file('token.json', SCOPES)
        self.service = build('drive', 'v3', credentials=self.creds)
        self.para_folder_ids = {}
        self._load_para_folders()

    def _load_para_folders(self):
        """Charge les IDs des dossiers PARA"""
        for folder_name in PARA_FOLDERS:
            results = self.service.files().list(
                q=f"name = '{folder_name}' and 'root' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
                fields="files(id, name)"
            ).execute()
            files = results.get('files', [])
            if files:
                self.para_folder_ids[folder_name] = files[0]['id']

    def list_shared_files(self, limit=50):
        """Liste les fichiers partagés avec l'utilisateur"""
        results = self.service.files().list(
            q="sharedWithMe = true and trashed = false",
            pageSize=limit,
            fields="files(id, name, mimeType, modifiedTime, createdTime, owners, sharingUser, webViewLink)",
            orderBy="modifiedTime desc"
        ).execute()
        return results.get('files', [])

    def export_shared_files(self, limit=50):
        """Exporte les fichiers partagés pour classification"""
        files = self.list_shared_files(limit)

        enriched = []
        for f in files:
            owner = f.get('owners', [{}])[0].get('displayName', '') if f.get('owners') else ''
            sharer = f.get('sharingUser', {}).get('displayName', '')

            enriched.append({
                'id': f['id'],
                'name': f['name'],
                'type': 'folder' if f['mimeType'] == 'application/vnd.google-apps.folder' else 'file',
                'mimeType': f['mimeType'],
                'modifiedTime': f.get('modifiedTime', ''),
                'createdTime': f.get('createdTime', ''),
                'owner': owner,
                'sharedBy': sharer,
                'webViewLink': f.get('webViewLink', '')
            })

        export_data = {
            'export_timestamp': datetime.now(timezone.utc).isoformat(),
            'total_items': len(enriched),
            'type': 'shared_files',
            'instructions': '''Classifie chaque fichier partagé dans UNE catégorie PARA.
Un RACCOURCI sera créé dans le dossier cible (le fichier original reste où il est).

CATÉGORIES:
- 1-Projects: Projets actifs, collaborations en cours
- 2-Areas: Domaines de responsabilité (travail, admin)
- 3-Resources: Références, documentation, templates partagés
- 4-Archives: Ancien, plus actif, historique

FORMAT:
{"id": "...", "name": "...", "category": "3-Resources", "reason": "..."}''',
            'items': enriched
        }

        with open('shared_files_to_classify.json', 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)

        print(f"✅ {len(enriched)} fichiers partagés exportés vers shared_files_to_classify.json")
        return enriched

    def create_shortcut(self, file_id, file_name, target_folder_id):
        """Crée un raccourci vers un fichier dans un dossier cible"""
        try:
            shortcut_metadata = {
                'name': file_name,
                'mimeType': 'application/vnd.google-apps.shortcut',
                'shortcutDetails': {
                    'targetId': file_id
                },
                'parents': [target_folder_id]
            }

            shortcut = self.service.files().create(
                body=shortcut_metadata,
                fields='id, name, shortcutDetails'
            ).execute()

            return True
        except HttpError as e:
            print(f"  ❌ Erreur: {e}")
            return False

    def import_classification(self, classification_file='shared_classification.json'):
        """Importe la classification et crée les raccourcis"""
        with open(classification_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        classifications = data.get('classifications', [])
        success = 0
        errors = 0

        print(f"\n🔗 Création de {len(classifications)} raccourcis...\n")

        for item in classifications:
            file_id = item.get('id')
            file_name = item.get('name', 'Unknown')
            category = item.get('category')

            if not file_id or not category:
                continue

            target_folder_id = self.para_folder_ids.get(category)
            if not target_folder_id:
                print(f"  ⚠️ Catégorie {category} non trouvée")
                errors += 1
                continue

            icon = "📁" if item.get('type') == 'folder' else "📄"
            print(f"  {icon} {file_name} → {category}...", end=" ")

            if self.create_shortcut(file_id, file_name, target_folder_id):
                print("✓")
                success += 1
            else:
                errors += 1

        print(f"\n✅ Terminé: {success} raccourcis créés, {errors} erreurs")


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'list'

    print("=" * 50)
    print("SHARED FILES ORGANIZER")
    print(f"Mode: {mode}")
    print("=" * 50)

    organizer = SharedFilesOrganizer()

    if mode == 'list':
        limit = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        files = organizer.list_shared_files(limit)

        print(f"\n{len(files)} fichiers partagés avec toi:\n")
        for f in files:
            icon = "📁" if f['mimeType'] == 'application/vnd.google-apps.folder' else "📄"
            owner = f.get('owners', [{}])[0].get('displayName', 'Inconnu') if f.get('owners') else f.get('sharingUser', {}).get('displayName', 'Inconnu')
            print(f"{icon} {f['name']}")
            print(f"   Partagé par: {owner}")
            print(f"   Modifié: {f.get('modifiedTime', 'N/A')[:10]}")
            print()

    elif mode == 'export':
        limit = int(sys.argv[2]) if len(sys.argv) > 2 else 50
        organizer.export_shared_files(limit)

    elif mode == 'import':
        classification_file = sys.argv[2] if len(sys.argv) > 2 else 'shared_classification.json'
        organizer.import_classification(classification_file)

    else:
        print("Usage:")
        print("  python3 shared_files_organizer.py list [limit]    - Liste les fichiers partagés")
        print("  python3 shared_files_organizer.py export [limit]  - Exporte pour classification")
        print("  python3 shared_files_organizer.py import [file]   - Crée les raccourcis")


if __name__ == '__main__':
    main()
