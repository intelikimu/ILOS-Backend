// api/applications.js - Applications endpoint
const { applyCors, handleCors, sendSuccess, handleError, sendValidationError, sendNotFound } = require('./_utils');
const db = require('../db');
const { z } = require('zod');

// Define Zod validation schema
const applicationSchema = z.object({
  quick_de_application_id: z.string().uuid(),
  reference_number: z.string().min(3),
  product_sub_class: z.string(),
  product_type: z.string(),
  program_type: z.string(),
  id_no: z.string().regex(/^\d{5}-\d{7}-\d{1}$/),
  application_date: z.string(),
  desired_financing: z.number(),
  currency: z.string().length(3),
  tenure_years: z.number().int(),
  purpose: z.string(),
  name_on_card: z.string(),
  key_secret_word: z.string(),
  auto_loan_no: z.string(),
  pmdc_no: z.string(),
  pmdc_issue_date: z.string(),
  pmdc_expiry_date: z.string(),
});

module.exports = async (req, res) => {
  try {
    // Apply CORS
    await applyCors(req, res);
    
    // Handle preflight
    if (handleCors(req, res)) return;

    // Parse URL to get path and ID
    const url = new URL(req.url, 'http://localhost');
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const id = pathSegments[pathSegments.length - 1];
    const isIdRoute = id && id !== 'applications' && !isNaN(id);

    switch (req.method) {
      case 'GET':
        if (isIdRoute) {
          // GET one application by ID
          try {
            const result = await db.query('SELECT * FROM loan_applications WHERE id = $1', [id]);
            if (result.rows.length === 0) {
              return sendNotFound(res, 'Application not found');
            }
            sendSuccess(res, result.rows[0]);
          } catch (err) {
            handleError(res, err, 'Error fetching application');
          }
        } else {
          // GET all applications
          try {
            const result = await db.query('SELECT * FROM loan_applications ORDER BY id DESC LIMIT 100');
            sendSuccess(res, result.rows);
          } catch (err) {
            handleError(res, err, 'Error fetching applications');
          }
        }
        break;

      case 'POST':
        // CREATE a new application
        const parsed = applicationSchema.safeParse(req.body);
        if (!parsed.success) {
          return sendValidationError(res, parsed.error.errors);
        }

        const {
          quick_de_application_id,
          reference_number,
          product_sub_class,
          product_type,
          program_type,
          id_no,
          application_date,
          desired_financing,
          currency,
          tenure_years,
          purpose,
          name_on_card,
          key_secret_word,
          auto_loan_no,
          pmdc_no,
          pmdc_issue_date,
          pmdc_expiry_date,
        } = parsed.data;

        try {
          const result = await db.query(
            `INSERT INTO loan_applications (
              quick_de_application_id,
              reference_number,
              product_sub_class,
              product_type,
              program_type,
              id_no,
              application_date,
              desired_financing,
              currency,
              tenure_years,
              purpose,
              name_on_card,
              key_secret_word,
              auto_loan_no,
              pmdc_no,
              pmdc_issue_date,
              pmdc_expiry_date
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
            RETURNING *`,
            [
              quick_de_application_id,
              reference_number,
              product_sub_class,
              product_type,
              program_type,
              id_no,
              application_date,
              desired_financing,
              currency,
              tenure_years,
              purpose,
              name_on_card,
              key_secret_word,
              auto_loan_no,
              pmdc_no,
              pmdc_issue_date,
              pmdc_expiry_date,
            ]
          );
          sendSuccess(res, result.rows[0], 201);
        } catch (err) {
          handleError(res, err, 'Error creating application');
        }
        break;

      case 'PUT':
        if (!isIdRoute) {
          return res.status(400).json({ error: 'ID is required for PUT requests' });
        }

        // UPDATE an existing application
        const updateParsed = applicationSchema.partial().safeParse(req.body);
        if (!updateParsed.success) {
          return sendValidationError(res, updateParsed.error.errors);
        }

        const fields = updateParsed.data;
        const keys = Object.keys(fields);
        const values = Object.values(fields);

        if (keys.length === 0) {
          return res.status(400).json({ error: 'No fields provided to update' });
        }

        const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
        const query = `UPDATE loan_applications SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;

        try {
          const result = await db.query(query, [...values, id]);
          if (result.rows.length === 0) {
            return sendNotFound(res, 'Application not found');
          }
          sendSuccess(res, result.rows[0]);
        } catch (err) {
          handleError(res, err, 'Error updating application');
        }
        break;

      case 'DELETE':
        if (!isIdRoute) {
          return res.status(400).json({ error: 'ID is required for DELETE requests' });
        }

        try {
          await db.query('DELETE FROM loan_applications WHERE id = $1', [id]);
          sendSuccess(res, { message: 'Application deleted' });
        } catch (err) {
          handleError(res, err, 'Error deleting application');
        }
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    handleError(res, error, 'Unexpected error in applications endpoint');
  }
}; 