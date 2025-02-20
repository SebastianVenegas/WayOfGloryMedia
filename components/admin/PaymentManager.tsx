import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, DollarSign, Receipt, Wallet, CreditCard, BanknoteIcon, CheckSquare } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface Payment {
  id: number;
  order_id: number;
  amount: number;
  payment_method: string;
  notes?: string;
  created_at: string;
  payment_type?: 'initial' | 'installment' | 'full';
  confirmation_details?: {
    zelle_confirmation?: string;
    paypal_transaction_id?: string;
  };
  installment_amount?: number;
  number_of_installments?: number;
  down_payment?: number;
  total_due_after_first?: number;
  payment_plan?: 'full' | 'installments';
  total_amount?: number;
  remaining_balance?: number;
}

interface PaymentManagerProps {
  orderId: number;
  totalAmount: number;
  onPaymentComplete: () => void;
  paymentPlan?: 'full' | 'installments';
  dueToday?: number;
  totalDueAfterFirst?: number;
  paymentFrequency?: 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Quarterly';
}

interface PaymentConfirmation {
  zelle_confirmation?: string;
  paypal_transaction_id?: string;
}

const paymentMethods = [
  {
    id: 'cash',
    label: 'Cash',
    icon: BanknoteIcon,
    description: 'Pay with cash in person'
  },
  {
    id: 'check',
    label: 'Check',
    icon: CheckSquare,
    description: 'Pay with a personal or business check'
  },
  {
    id: 'zelle',
    label: 'Zelle',
    icon: Wallet,
    description: 'Instant bank transfer via Zelle'
  },
  {
    id: 'paypal',
    label: 'PayPal',
    icon: CreditCard,
    description: 'Pay securely via PayPal'
  }
];

export default function PaymentManager({ 
  orderId, 
  totalAmount,
  onPaymentComplete,
  paymentPlan,
  dueToday,
  totalDueAfterFirst,
  paymentFrequency
}: PaymentManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentConfirmation, setPaymentConfirmation] = useState<PaymentConfirmation>({});
  const [paymentType, setPaymentType] = useState<'full' | 'installment'>('installment');
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentHistory();
  }, [orderId]);

  const fetchPaymentHistory = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching payment history for order:', orderId);
      
      const response = await fetch(`/api/admin/orders/${orderId}/payments`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      // Log response details for debugging
      console.log('Payment history response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Payment history data:', data);
      
      if (!data) {
        throw new Error('No data received from server');
      }

      setPaymentHistory(data.payment_history || []);
      setTotalPaid(parseFloat(data.total_paid) || 0);
      
      // If we have an installment amount stored, use it
      if (data.installment_amount) {
        setPaymentAmount(data.installment_amount.toString());
      }
      
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast({
        title: 'Error loading payments',
        description: error instanceof Error ? error.message : 'Failed to load payment history. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async () => {
    try {
      if (!paymentAmount || !paymentMethod) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      // Validate confirmation details for Zelle and PayPal
      if (paymentMethod === 'zelle' && !paymentConfirmation.zelle_confirmation) {
        toast({
          title: 'Error',
          description: 'Please enter the Zelle confirmation code',
          variant: 'destructive'
        });
        return;
      }

      if (paymentMethod === 'paypal' && !paymentConfirmation.paypal_transaction_id) {
        toast({
          title: 'Error',
          description: 'Please enter the PayPal transaction ID',
          variant: 'destructive'
        });
        return;
      }

      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: 'Error',
          description: 'Please enter a valid payment amount',
          variant: 'destructive'
        });
        return;
      }

      setIsLoading(true);

      // Get the stored installment amount from the first payment
      const firstPayment = paymentHistory[0];
      const storedInstallmentAmount = firstPayment?.installment_amount;

      // Calculate new remaining balance
      const newRemainingBalance = remainingBalance - amount;

      // Prepare payment data
      const paymentData = {
        amount,
        paymentMethod,
        notes,
        confirmation: paymentConfirmation,
        paymentType,
        installmentAmount: storedInstallmentAmount,
        payment_plan: paymentPlan,
        total_amount: totalAmount,
        remaining_balance: newRemainingBalance,
        number_of_installments: firstPayment?.number_of_installments,
        down_payment: firstPayment?.down_payment,
        total_due_after_first: firstPayment?.total_due_after_first
      };

      const response = await fetch(`/api/admin/orders/${orderId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Payment recorded successfully'
        });
        setIsAddingPayment(false);
        fetchPaymentHistory();
        if (onPaymentComplete) {
          onPaymentComplete();
        }
      } else {
        throw new Error(data.error || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to record payment',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset payment confirmation when payment method changes
  useEffect(() => {
    setPaymentConfirmation({});
  }, [paymentMethod]);

  const remainingBalance = totalAmount - totalPaid;

  // Calculate installment amount
  const calculateInstallmentAmount = () => {
    if (paymentHistory.length === 0) {
      return remainingBalance / (totalDueAfterFirst ? Math.ceil(totalDueAfterFirst / totalAmount) : 1);
    }
    
    // Use the stored installment amount if available
    const firstPayment = paymentHistory[0];
    if (firstPayment && firstPayment.installment_amount) {
      return firstPayment.installment_amount;
    }

    return remainingBalance / (totalDueAfterFirst ? Math.ceil(totalDueAfterFirst / totalAmount) : 1);
  };

  // Update payment amount when payment type changes
  useEffect(() => {
    if (paymentType === 'full') {
      setPaymentAmount(remainingBalance.toString());
    } else {
      // For installment payments, use the stored installment amount from the first payment
      const firstPayment = paymentHistory[0];
      if (firstPayment?.installment_amount) {
        setPaymentAmount(firstPayment.installment_amount.toString());
      }
    }
  }, [paymentType, remainingBalance, paymentHistory]);

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded-lg">
          <div className="text-sm text-gray-500">Total Amount</div>
          <div className="text-2xl font-semibold">${formatPrice(totalAmount)}</div>
        </div>
        <div className="p-4 bg-white border rounded-lg">
          <div className="text-sm text-gray-500">Total Paid</div>
          <div className="text-2xl font-semibold text-green-600">${formatPrice(totalPaid)}</div>
        </div>
        <div className="p-4 bg-white border rounded-lg">
          <div className="text-sm text-gray-500">Remaining Balance</div>
          <div className="text-2xl font-semibold text-blue-600">${formatPrice(remainingBalance)}</div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold">Payment History</h3>
        </div>
        <div className="divide-y">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            </div>
          ) : paymentHistory.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No payments recorded yet
            </div>
          ) : (
            paymentHistory.map((payment, index) => (
              <div key={payment.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">${formatPrice(payment.amount)}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(payment.created_at).toLocaleDateString()} via {payment.payment_method}
                    </div>
                    {payment.notes && (
                      <div className="text-sm text-gray-600 mt-1">{payment.notes}</div>
                    )}
                  </div>
                  <Receipt className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Payment Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setIsAddingPayment(true)}
          disabled={isLoading || remainingBalance <= 0}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Add Payment Dialog */}
      <Dialog open={isAddingPayment} onOpenChange={setIsAddingPayment}>
        <DialogContent className="sm:max-w-[500px] bg-white shadow-lg border-0">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold">Record Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Payment Type Selection */}
            <div className="space-y-2">
              <Label>Payment Type</Label>
              <RadioGroup
                value={paymentType}
                onValueChange={(value: 'full' | 'installment') => setPaymentType(value)}
                className="grid grid-cols-2 gap-4"
              >
                <div className="relative">
                  <RadioGroupItem
                    value="installment"
                    id="installment"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Label
                    htmlFor="installment"
                    className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer transition-all duration-200 ${
                      paymentType === 'installment'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <DollarSign className={`mb-3 h-6 w-6 ${
                      paymentType === 'installment' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                    <div className={`text-sm font-medium ${
                      paymentType === 'installment' ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      Pay Installment
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      Pay next scheduled payment
                    </div>
                  </Label>
                </div>

                <div className="relative">
                  <RadioGroupItem
                    value="full"
                    id="full"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Label
                    htmlFor="full"
                    className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer transition-all duration-200 ${
                      paymentType === 'full'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Wallet className={`mb-3 h-6 w-6 ${
                      paymentType === 'full' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                    <div className={`text-sm font-medium ${
                      paymentType === 'full' ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      Pay Remaining
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      Pay full remaining balance
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Payment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={remainingBalance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className={`pl-7 ${paymentType === 'installment' ? 'bg-gray-100' : ''}`}
                  placeholder="0.00"
                  disabled={paymentType === 'installment'}
                />
              </div>
              {paymentType === 'installment' && paymentHistory[0]?.installment_amount && (
                <p className="text-sm text-blue-600">
                  Fixed installment amount: ${formatPrice(paymentHistory[0].installment_amount)}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="grid grid-cols-2 gap-4"
              >
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div key={method.id} className="relative">
                      <RadioGroupItem
                        value={method.id}
                        id={method.id}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Label
                        htmlFor={method.id}
                        className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer transition-all duration-200 ${
                          paymentMethod === method.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className={`mb-3 h-6 w-6 ${
                          paymentMethod === method.id ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                        <div className={`text-sm font-medium ${
                          paymentMethod === method.id ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {method.label}
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          {method.description}
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Payment Confirmation Fields */}
            {paymentMethod === 'zelle' && (
              <div className="space-y-2">
                <Label htmlFor="zelle-confirmation">Zelle Confirmation Code</Label>
                <Input
                  id="zelle-confirmation"
                  value={paymentConfirmation.zelle_confirmation || ''}
                  onChange={(e) => setPaymentConfirmation(prev => ({
                    ...prev,
                    zelle_confirmation: e.target.value
                  }))}
                  placeholder="Enter Zelle confirmation code"
                  className="font-mono"
                />
              </div>
            )}

            {paymentMethod === 'paypal' && (
              <div className="space-y-2">
                <Label htmlFor="paypal-transaction">PayPal Transaction ID</Label>
                <Input
                  id="paypal-transaction"
                  value={paymentConfirmation.paypal_transaction_id || ''}
                  onChange={(e) => setPaymentConfirmation(prev => ({
                    ...prev,
                    paypal_transaction_id: e.target.value
                  }))}
                  placeholder="Enter PayPal transaction ID"
                  className="font-mono"
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsAddingPayment(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPayment}
              disabled={isLoading || !paymentAmount || !paymentMethod || 
                (paymentMethod === 'zelle' && !paymentConfirmation.zelle_confirmation) ||
                (paymentMethod === 'paypal' && !paymentConfirmation.paypal_transaction_id)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Payment
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 