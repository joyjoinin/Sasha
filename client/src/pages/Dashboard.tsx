import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Search,
  LogOut,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileText,
  Building2,
  DollarSign,
  TrendingUp,
  Filter,
  X,
  JapaneseYen,
  JapaneseYenIcon,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

/**
 * Dashboard - Invoice Data Search, Aggregation and Filtering Page
 * Design Philosophy: Modern Minimalist with Glassmorphism
 * - Dark theme with teal accents
 * - Keyword search and advanced filtering
 * - Real-time data aggregation and statistics
 * - Responsive card-based layout
 */

interface InvoiceData {
  发票号: string;
  开票公司: string;
  收票公司: string;
  时间: string;
  产品名称: string;
  默认规格: string | null;
  数量: number;
  含税总价: number;
}

interface AggregationStats {
  totalInvoices: number;
  totalAmount: number;
  averageAmount: number;
  maxAmount: number;
  minAmount: number;
  companyCount: number;
  productCount: number;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InvoiceData | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });

  // Load invoice data from JSON file
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}invoice_data.json`
        );
        const data = await response.json();
        setInvoiceData(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading invoice data:", error);
        toast.error("Failed to load invoice data");
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Get unique companies for filter dropdown
  const uniqueCompanies = useMemo(() => {
    return Array.from(new Set(invoiceData.map(item => item.开票公司))).sort();
  }, [invoiceData]);

  // Filter data based on all criteria
  const filteredData = useMemo(() => {
    return invoiceData.filter(item => {
      // Keyword search
      if (searchKeyword.trim()) {
        const keyword = searchKeyword.toLowerCase();
        const matchesKeyword =
          (item.发票号 && item.发票号.toLowerCase().includes(keyword)) ||
          (item.开票公司 && item.开票公司.toLowerCase().includes(keyword)) ||
          (item.收票公司 && item.收票公司.toLowerCase().includes(keyword)) ||
          (item.产品名称 && item.产品名称.toLowerCase().includes(keyword));
        if (!matchesKeyword) return false;
      }

      // Company filter
      if (selectedCompany && item.开票公司 !== selectedCompany) {
        return false;
      }

      // Date range filter
      if (dateRange.start || dateRange.end) {
        const itemDate = new Date(item.时间);
        if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          if (itemDate < startDate) return false;
        }
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (itemDate > endDate) return false;
        }
      }

      // Price range filter
      if (priceRange.min || priceRange.max) {
        const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
        const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        if (item.含税总价 < minPrice || item.含税总价 > maxPrice) {
          return false;
        }
      }

      return true;
    });
  }, [searchKeyword, invoiceData, selectedCompany, dateRange, priceRange]);

  // Calculate aggregation statistics
  const stats: AggregationStats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        totalInvoices: 0,
        totalAmount: 0,
        averageAmount: 0,
        maxAmount: 0,
        minAmount: 0,
        companyCount: 0,
        productCount: 0,
      };
    }

    const amounts = filteredData
      .map(item => item.含税总价)
      .filter(
        amount => amount !== null && amount !== undefined && !isNaN(amount)
      );
    if (amounts.length === 0) {
      return {
        totalInvoices: 0,
        totalAmount: 0,
        averageAmount: 0,
        maxAmount: 0,
        minAmount: 0,
        companyCount: 0,
        productCount: 0,
      };
    }
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    const companies = new Set(filteredData.map(item => item.开票公司));
    const products = new Set(filteredData.map(item => item.产品名称));

    return {
      totalInvoices: filteredData.length,
      totalAmount,
      averageAmount: totalAmount / amounts.length,
      maxAmount: Math.max(...amounts),
      minAmount: Math.min(...amounts),
      companyCount: companies.size,
      productCount: products.size,
    };
  }, [filteredData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKeyword.trim()) {
      toast.error("Please enter a search keyword");
      return;
    }

    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      if (filteredData.length === 0) {
        toast.info("No invoices found for your search");
      } else {
        toast.success(`Found ${filteredData.length} invoice(s)`);
      }
    }, 500);
  };

  const handleLogout = () => {
    toast.success("Logged out successfully");
    setTimeout(() => {
      setLocation("/");
    }, 1000);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "¥0.00";
    }
    return `¥${value.toFixed(2)}`;
  };

  const clearFilters = () => {
    setSelectedCompany("");
    setDateRange({ start: "", end: "" });
    setPriceRange({ min: "", max: "" });
    setSearchKeyword("");
    setSelectedItem(null);
  };

  const hasActiveFilters =
    searchKeyword ||
    selectedCompany ||
    dateRange.start ||
    dateRange.end ||
    priceRange.min ||
    priceRange.max;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading invoice data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1
              className="text-xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Invoice Dashboard
            </h1>
          </div>

          <Button
            onClick={handleLogout}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm mb-1">Total Invoices</p>
                  <p className="text-3xl font-bold">{stats.totalInvoices}</p>
                </div>
                <FileText className="w-10 h-10 text-cyan-400/30" />
              </div>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm mb-1">Total Amount</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.totalAmount)}
                  </p>
                </div>
                <JapaneseYen className="w-10 h-10 text-green-400/30" />
              </div>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm mb-1">Average Amount</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.averageAmount)}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-400/30" />
              </div>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm mb-1">Companies</p>
                  <p className="text-3xl font-bold">{stats.companyCount}</p>
                </div>
                <Building2 className="w-10 h-10 text-purple-400/30" />
              </div>
            </Card>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-2xl font-bold"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Search & Filter
              </h2>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 flex items-center gap-2 text-sm"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
              )}
            </div>

            <form onSubmit={handleSearch} className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search by invoice number, company, or product..."
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  className="pl-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 transition-all duration-300 h-12"
                />
              </div>
              <Button
                type="submit"
                disabled={isSearching || !searchKeyword.trim()}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-6 h-12 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Search</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
            </form>

            {/* Advanced Filters */}
            {showFilters && (
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur p-6 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Company Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Company
                    </label>
                    <select
                      value={selectedCompany}
                      onChange={e => setSelectedCompany(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
                    >
                      <option value="">All Companies</option>
                      {uniqueCompanies.map(company => (
                        <option key={company} value={company}>
                          {company}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range - Start */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={e =>
                        setDateRange({ ...dateRange, start: e.target.value })
                      }
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20"
                    />
                  </div>

                  {/* Date Range - End */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={e =>
                        setDateRange({ ...dateRange, end: e.target.value })
                      }
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20"
                    />
                  </div>

                  {/* Price Range - Min */}
                  {/* <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Min Price (¥)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={priceRange.min}
                      onChange={e =>
                        setPriceRange({ ...priceRange, min: e.target.value })
                      }
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20"
                    />
                  </div> */}

                  {/* Price Range - Max */}
                  {/* <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Max Price (¥)
                    </label>
                    <Input
                      type="number"
                      placeholder="999999"
                      value={priceRange.max}
                      onChange={e =>
                        setPriceRange({ ...priceRange, max: e.target.value })
                      }
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20"
                    />
                  </div> */}
                </div>
              </Card>
            )}
          </div>

          {/* Results Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Results List */}
            <div className="lg:col-span-1">
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur h-full">
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4">
                    Results ({filteredData.length})
                  </h3>

                  {filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertCircle className="w-12 h-12 text-slate-600 mb-3" />
                      <p className="text-slate-400 text-sm">
                        {hasActiveFilters
                          ? "No invoices match your filters. Try adjusting your criteria."
                          : "Enter a search keyword to get started."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredData.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedItem(item)}
                          className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center justify-between group ${
                            selectedItem === item
                              ? "bg-cyan-500/20 border border-cyan-500/30"
                              : "hover:bg-slate-700/50 border border-slate-700/30"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-medium truncate text-sm">
                              {item.发票号}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {item.开票公司}
                            </p>
                            <p className="text-xs text-cyan-400 font-semibold">
                              {formatCurrency(item.含税总价)}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 flex-shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Detail View */}
            <div className="lg:col-span-2">
              {selectedItem ? (
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">
                          {selectedItem.发票号}
                        </h3>
                        <p className="text-slate-400 text-sm">
                          {selectedItem.开票公司}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Invoice Number */}
                      <div className="flex items-start gap-4 pb-4 border-b border-slate-700/50">
                        <FileText className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 mb-1">
                            Invoice Number
                          </p>
                          <p className="text-sm font-medium break-all">
                            {selectedItem.发票号}
                          </p>
                        </div>
                      </div>

                      {/* Issuer Company */}
                      <div className="flex items-start gap-4 pb-4 border-b border-slate-700/50">
                        <Building2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Issuer</p>
                          <p className="text-sm font-medium">
                            {selectedItem.开票公司}
                          </p>
                        </div>
                      </div>

                      {/* Recipient Company */}
                      <div className="flex items-start gap-4 pb-4 border-b border-slate-700/50">
                        <Building2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 mb-1">
                            Recipient
                          </p>
                          <p className="text-sm font-medium">
                            {selectedItem.收票公司}
                          </p>
                        </div>
                      </div>

                      {/* Invoice Date */}
                      <div className="flex items-start gap-4 pb-4 border-b border-slate-700/50">
                        <FileText className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 mb-1">
                            Invoice Date
                          </p>
                          <p className="text-sm font-medium">
                            {formatDate(selectedItem.时间)}
                          </p>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex items-start gap-4 pb-4 border-b border-slate-700/50">
                        <FileText className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Product</p>
                          <p className="text-sm font-medium">
                            {selectedItem.产品名称}
                          </p>
                          {selectedItem.默认规格 && (
                            <p className="text-xs text-slate-500 mt-1">
                              Spec: {selectedItem.默认规格}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-start gap-4 pb-4 border-b border-slate-700/50">
                        <FileText className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 mb-1">
                            Quantity
                          </p>
                          <p className="text-sm font-medium">
                            {selectedItem.数量}
                          </p>
                        </div>
                      </div>

                      {/* Total Amount */}
                      <div className="flex items-start gap-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                        <JapaneseYen className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 mb-1">
                            Total Amount (Tax Included)
                          </p>
                          <p className="text-lg font-bold text-cyan-400">
                            {formatCurrency(selectedItem.含税总价)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-8 pt-6 border-t border-slate-700/50">
                      <Button className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold">
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50"
                      >
                        Print
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur h-full flex items-center justify-center min-h-96">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-2">No invoice selected</p>
                    <p className="text-slate-500 text-sm">
                      Search for invoices and click on a result to view details
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
