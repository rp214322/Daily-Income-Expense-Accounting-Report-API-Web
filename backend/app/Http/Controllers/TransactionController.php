<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Transaction;
use Illuminate\Support\Facades\Validator;

class TransactionController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:income,expense',
            'transaction_date' => 'required|date',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        // Create the transaction if validation passes
        $incomeExpense = Transaction::create($request->all());

        return response()->json($incomeExpense, 201);
    }

    // Get all records
    public function index(Request $request)
    {
        $query = Transaction::query();

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $records = $query->get();

        return response()->json($records);
    }

    // Update an existing record
    public function update(Request $request, $id)
    {
        $incomeExpense = Transaction::findOrFail($id);

        $request->validate([
            'type' => 'required|in:income,expense',
            'date' => 'required|date',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric',
        ]);

        $incomeExpense->update($request->all());

        return response()->json($incomeExpense);
    }

    // Delete a record
    public function destroy($id)
    {
        $incomeExpense = Transaction::findOrFail($id);
        $incomeExpense->delete();

        return response()->json(null, 204);
    }
}
