import React from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';

// Props:
// - amount: number (in PHP)
// - description: string
// - onApprove: (details) => void
// - onError: (err) => void
// - disabled: boolean
const PayPalCheckout = ({ amount, description, onApprove, onError, disabled }) => {
    const [{ isPending }] = usePayPalScriptReducer();

    if (!amount || Number(amount) <= 0) {
        return null;
    }

    return (
        <div className="w-full">
            <PayPalButtons
                style={{ layout: 'vertical', shape: 'rect', color: 'blue' }}
                disabled={disabled || isPending}
                fundingSource={undefined}
                createOrder={(data, actions) => {
                    return actions.order.create({
                        purchase_units: [
                            {
                                amount: {
                                    currency_code: 'PHP',
                                    value: `${Number(amount).toFixed(2)}`,
                                },
                                description: description?.slice(0, 127) || 'BiyaHele Booking',
                            },
                        ],
                        application_context: {
                            shipping_preference: 'NO_SHIPPING',
                        },
                    });
                }}
                onApprove={async (data, actions) => {
                    try {
                        const details = await actions.order.capture();
                        onApprove && onApprove(details);
                    } catch (err) {
                        onError && onError(err);
                    }
                }}
                onError={(err) => {
                    onError && onError(err);
                }}
            />
        </div>
    );
};

export default PayPalCheckout;


