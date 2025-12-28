import { pool } from "../db/index.js";

export async function logRegistrationAction({
                                                registration_id,
                                                actor_user_id,
                                                actor_role,
                                                action,
                                                old_status = null,
                                                new_status = null,
                                                message = null
                                            }) {
    await pool.query(
        `
        INSERT INTO registration_audit_log (
            registration_id,
            actor_user_id,
            actor_role,
            action,
            old_status,
            new_status,
            message
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `,
        [
            registration_id,
            actor_user_id,
            actor_role,
            action,
            old_status,
            new_status,
            message
        ]
    );
}
