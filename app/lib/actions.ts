'use server';
import {z} from 'zod';
import {sql} from '@vercel/postgres'
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const InvoiceSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['paid', 'pending', 'draft']),
    date: z.string(),
});

const CreateInvoice = InvoiceSchema.omit({id: true, date: true});
const UpdateIvnvoice = InvoiceSchema.omit({id: true, date: true});

export async function createInvoice(formData: FormData) {
    // const rawFormData = CreateInvoice.parse({
    //     customerId: formData.get('customerId'),
    //     amount: formData.get('amount'),
    //     status: formData.get('status'),
    // })

    const rawFormData = CreateInvoice.parse(Object.fromEntries(formData.entries()))
    const amountInCents = rawFormData.amount * 100;
    const date = new Date().toISOString().split('T')[0];

    try {
        await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${rawFormData.customerId}, ${amountInCents}, ${rawFormData.status}, ${date})
        `
    } catch (error) {
        return {
            message: 'Something went wrong',
        }
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
    const rawFormData = UpdateIvnvoice.parse(Object.fromEntries(formData.entries()));
    const amountInCents = rawFormData.amount * 100;

    try {
        await sql`
        UPDATE invoices
        SET customer_id = ${rawFormData.customerId},
            amount = ${amountInCents},
            status = ${rawFormData.status}
        WHERE id = ${id}
        `
    } catch (error) {
        return {
            message: 'Something went wrong',
        }
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    throw new Error('Not implemented');

    try {
        await sql`
        DELETE FROM invoices
        WHERE id = ${id}
        `
    }catch (error) {
        return {
            message: 'Something went wrong',
        }
    }

    revalidatePath('/dashboard/invoices');
    // redirect('/dashboard/invoices');
}