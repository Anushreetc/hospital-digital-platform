import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { Appointment } from '../models/types';

export class GoogleSheetsRepository {
  private doc: GoogleSpreadsheet | null = null;
  private isInitialized = false;

  constructor() {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
      ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (spreadsheetId && clientEmail && privateKey) {
      try {
        const serviceAccountAuth = new JWT({
          email: clientEmail,
          key: privateKey,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        this.doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
      } catch (err) {
        console.warn('[GoogleSheetsRepository] Failed to instantiate GoogleSpreadsheet:', err);
        this.doc = null;
      }
    } else {
      console.log('[GoogleSheetsRepository] Google Sheets credentials not configured. Local fallback repository active.');
    }
  }

  private async init(): Promise<boolean> {
    if (this.isInitialized && this.doc) return true;
    if (!this.doc) return false;

    try {
      await this.doc.loadInfo();
      this.isInitialized = true;
      return true;
    } catch (err) {
      console.error('[GoogleSheetsRepository] Failed to load spreadsheet info:', err);
      return false;
    }
  }

  public async saveAppointment(appointment: Appointment): Promise<boolean> {
    const initialized = await this.init();
    if (!initialized || !this.doc) {
      console.warn('[GoogleSheetsRepository] Cannot write to Google Sheets: Repository not initialized.');
      return false;
    }

    try {
      let sheet = this.doc.sheetsByTitle['Appointments'];
      if (!sheet) {
        sheet = await this.doc.addSheet({
          title: 'Appointments',
          headerValues: [
            'Appointment ID',
            'Created At',
            'Updated At',
            'Patient Name',
            'Phone',
            'Department',
            'Doctor',
            'Preferred Date',
            'Preferred Time',
            'Reason',
            'Source',
            'Language',
            'Status',
            'Notes',
            'Agent Session ID'
          ]
        });
      }

      await sheet.addRow({
        'Appointment ID': appointment.id,
        'Created At': appointment.createdAt,
        'Updated At': appointment.updatedAt,
        'Patient Name': appointment.patientName,
        'Phone': appointment.patientPhone,
        'Department': appointment.departmentName,
        'Doctor': appointment.doctorName,
        'Preferred Date': appointment.preferredDate,
        'Preferred Time': appointment.preferredTime,
        'Reason': appointment.reason,
        'Source': appointment.source,
        'Language': appointment.language,
        'Status': appointment.status,
        'Notes': JSON.stringify(appointment.notes || []),
        'Agent Session ID': appointment.agentSessionId || ''
      });

      console.log(`[GoogleSheetsRepository] Successfully saved appointment ${appointment.id} to Google Sheets`);
      return true;
    } catch (err) {
      console.error('[GoogleSheetsRepository] Error adding row to Google Sheets:', err);
      return false;
    }
  }

  public async updateAppointmentStatus(appointmentId: string, status: string, notesJson: string): Promise<boolean> {
    const initialized = await this.init();
    if (!initialized || !this.doc) return false;

    try {
      const sheet = this.doc.sheetsByTitle['Appointments'];
      if (!sheet) return false;

      const rows = await sheet.getRows();
      const targetRow = rows.find(r => r.get('Appointment ID') === appointmentId);
      if (targetRow) {
        targetRow.set('Status', status);
        targetRow.set('Updated At', new Date().toISOString());
        if (notesJson) {
          targetRow.set('Notes', notesJson);
        }
        await targetRow.save();
        return true;
      }
      return false;
    } catch (err) {
      console.error('[GoogleSheetsRepository] Failed to update status in Google Sheets:', err);
      return false;
    }
  }
}
