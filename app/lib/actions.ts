'use server';
import {z} from 'zod';
import {sql} from '@vercel/postgres'
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';


const InvoiceSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer',
        required_error: 'Please select a customer'
    })   ,
    amount: z.coerce.number({
        invalid_type_error: 'Please enter an amount',
        required_error: 'Please enter an amount'
    }),
    status: z.enum(['paid', 'pending', 'draft'], {
        invalid_type_error: 'Please select a status',
        required_error: 'Please select a status'
    }),
    date: z.string(),
});

const CreateInvoice =  InvoiceSchema.omit({ id: true, date: true }) // InvoiceSchema.omit({id: true, date: true});
const UpdateIvnvoice = InvoiceSchema.omit({id: true, date: true});

export type State = {
    errors?: {
      customerId?: string[];
      amount?: string[];
      status?: string[];
    };
    message?: string | null;
  };

export async function authenticate(
    prevState: string | undefined,
    formData: FormData
) {
    try {
        await signIn('credentials', Object.fromEntries(formData));
    } catch (error) {
        if ((error as Error).message.includes('CredentialsSignin')) {
            return 'CredentialSignin'
        }

        throw error;
    }
}

export async function createInvoice(prevState: State, formData: FormData) {
    // const rawFormData = CreateInvoice.parse({
    //     customerId: formData.get('customerId'),
    //     amount: formData.get('amount'),
    //     status: formData.get('status'),
    // })

    const validatedFields = CreateInvoice.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing required fields'
        }
    }

    const rawFormData = validatedFields.data;
    
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