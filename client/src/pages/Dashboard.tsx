import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Search,
  LogOut,
  Loader2,
  FileText,
  Building2,
  Filter,
  X,
  JapaneseYen,
  Upload,
  Download,
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import axios from "axios";
import requestWithType from "@/utils/request";
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

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // 暂存选中的文件
  const [fileError, setFileError] = useState(""); // 文件校验错误提示

  // 2. 按钮状态（你已有的状态，确保存在）
  const [isUploading, setIsUploading] = useState(false); // 上传中状态

  // 3. 绑定隐藏的文件输入框（你已定义的 ref）
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File download state
  const [isDownloading, setIsDownloading] = useState(false);

  // Category filter states
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedBillingCompany, setSelectedBillingCompany] =
    useState<string>("");
  const [selectedInvoiceCompany, setSelectedInvoiceCompany] =
    useState<string>("");
  const [showCompanyList, setShowCompanyList] = useState(false);

  // Load invoice data from JSON file
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await requestWithType.get("/all_invoices");
        const data = res.data;
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

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // 每页最多显示10条

  // Get unique companies for filter dropdown
  const uniqueCompanies = useMemo(() => {
    return Array.from(
      new Set(invoiceData.map(item => item.开票公司).filter(Boolean))
    ).sort();
  }, [invoiceData]);

  // Get unique categories for filters
  const uniqueProducts = useMemo(() => {
    return Array.from(
      new Set(invoiceData.map(item => item.产品名称).filter(Boolean))
    ).sort();
  }, [invoiceData]);

  const uniqueBillingCompanies = useMemo(() => {
    return Array.from(
      new Set(invoiceData.map(item => item.收票公司).filter(Boolean))
    ).sort();
  }, [invoiceData]);

  const uniqueInvoiceCompanies = useMemo(() => {
    return Array.from(
      new Set(invoiceData.map(item => item.开票公司).filter(Boolean))
    ).sort();
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
      // if (selectedCompany && item.开票公司 !== selectedCompany) {
      //   return false;
      // }

      // Category filters
      if (selectedProduct && item.产品名称 !== selectedProduct) {
        return false;
      }
      if (selectedBillingCompany && item.收票公司 !== selectedBillingCompany) {
        return false;
      }
      if (selectedInvoiceCompany && item.开票公司 !== selectedInvoiceCompany) {
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

      setCurrentPage(1);

      return true;
    });
  }, [
    searchKeyword,
    invoiceData,
    selectedCompany,
    selectedProduct,
    selectedBillingCompany,
    selectedInvoiceCompany,
    dateRange,
    priceRange,
  ]);

  // 计算总页数
  const totalPages = Math.ceil(filteredData.length / pageSize);

  // 计算当前页需要展示的数据
  const currentData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 切换页码
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

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

  // Handle Excel file upload
  // 处理文件选择（文件输入框 onChange 触发）
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. 获取用户选择的文件（只取第一个文件）
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setFileError("");
      return;
    }

    // 2. 清空之前的错误提示
    setFileError("");

    // 3. 校验文件类型（仅允许 xlsx、xls、csv，与 input 的 accept 对应）
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
      "application/vnd.ms-excel", // xls
      "text/csv", // csv
    ];
    const fileExtension = file.name.split(".").pop()?.toLowerCase(); // 从文件名获取后缀（兼容浏览器类型识别问题）
    const isTypeValid =
      allowedTypes.includes(file.type) ||
      ["xlsx", "xls", "csv"].includes(fileExtension || "");

    if (!isTypeValid) {
      setSelectedFile(null);
      setFileError("请选择正确的文件类型（仅支持 .xlsx、.xls、.csv）");
      return;
    }

    // 4. 校验文件大小（示例：限制 10MB 以内，可根据需求调整）
    const maxSize = 10 * 1024 * 1024; // 10MB（单位：字节）
    if (file.size > maxSize) {
      setSelectedFile(null);
      setFileError(`文件大小不能超过 ${maxSize / 1024 / 1024}MB`);
      return;
    }

    // 5. 校验通过，暂存文件到状态
    setSelectedFile(file);
    setFileError("");
    alert("文件选择成功");
    console.log("文件选择成功：", file.name);
  };

  // 触发文件上传（上传按钮 onClick 触发）
  const handleUpload = async () => {
    if (!selectedFile) {
      setFileError("请先选择要上传的文件");
      fileInputRef.current?.click(); // 自动触发文件选择
      return;
    }
    if (isUploading) return;

    try {
      setIsUploading(true);
      setFileError("");

      const formData = new FormData();
      formData.append("excelFile", selectedFile);

      const response = await axios.post(
        "http://localhost:5000/upload-excel",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000,
        }
      );

      // 成功逻辑（不变）
      if (response.data.code === 200) {
        alert(`上传成功！共导入 ${response.data.data.new_added} 条数据`);
        setSelectedFile(null); // 重置文件状态
        if (fileInputRef.current) fileInputRef.current.value = ""; // 重置输入框
        // 可选：刷新数据列表
        // fetchCurrentData();
      } else {
        // 后端业务错误（如表头缺失）：也要重置状态
        setFileError(`上传失败：${response.data.msg || "未知错误"}`);
        setSelectedFile(null); // 修复1：重置文件状态
        if (fileInputRef.current) fileInputRef.current.value = ""; // 修复2：重置输入框
      }
    } catch (error: any) {
      // 网络错误/异常：强制重置状态
      console.error("上传异常：", error);
      let errorMsg = "上传失败：未知错误";
      if (error.response) {
        errorMsg = `上传失败：${error.response.status} - ${error.response.data?.msg || "服务器错误"}`;
      } else if (error.request) {
        errorMsg = "上传失败：无法连接到服务器，请检查网络";
      } else {
        errorMsg = `上传失败：${error.message}`;
      }
      setFileError(errorMsg);
      // 修复3：失败后重置文件状态和输入框
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      // 修复4：无论成功/失败，都重置上传状态（避免按钮一直禁用）
      setIsUploading(false);
    }
  };

  // Get unique companies from filtered data
  const uniqueFilteredCompanies = useMemo(() => {
    const companies = new Set(
      filteredData.map(item => item.开票公司).filter(Boolean)
    );
    return Array.from(companies).sort();
  }, [filteredData]);

  const handleDownload = async () => {
    setIsDownloading(true);
    const filters = {
      receive_company: selectedBillingCompany,
      issue_company: selectedInvoiceCompany,
      start_date: dateRange.start,
      end_date: dateRange.end,
      product_name: selectedProduct,
    };
    try {
      // 1. 构建查询参数（空值不传入）
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value.trim()) {
          // 只传非空参数
          params.append(key, value.trim());
        }
      });

      // 2. 替换为axios.get请求（核心修改）
      // 注意：如果download接口是下载文件，需加responseType；如果是获取数据，无需加
      const response = await axios.get(
        `http://localhost:5000/download`, // 你的目标接口地址
        {
          params: Object.fromEntries(params), // axios自动拼接参数到URL
          // 如果是下载文件，需添加以下配置（关键！）
          responseType: "blob",
          headers: {
            "Content-Type": "application/json",
            // 如需认证，添加token：
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
        }
      );

      const contentDisposition = response.headers["content-disposition"];
      let filename = "发票数据.csv";
      if (contentDisposition) {
        // 解析后端返回的文件名
        const filenameMatch = contentDisposition.match(
          /filename\*=utf-8''(.*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      // 创建临时URL和下载链接
      const blob = new Blob([response.data], {
        type: "text/csv; charset=utf-8",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename; // 指定下载文件名
      document.body.appendChild(a);
      a.click();

      // 清理临时资源（避免内存泄漏）
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert("CSV文件下载成功！");
      setIsDownloading(false);
    } catch (error) {
      // 4. axios异常处理（比fetch更友好）
      console.error("请求失败：", error);
      if (error) {
        // 服务器返回错误（4xx/5xx）
        alert(`请求失败：${error} "}`);
      } else if (error) {
        // 请求已发送但无响应
        alert("请求失败：无法连接到服务器，请检查接口地址");
      } else {
        // 请求配置错误
        alert(`请求失败：${error}`);
      }
    } finally {
      setIsDownloading(false);
    }
  };

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
    toast.success("成功退出");
    setTimeout(() => {
      setLocation("/");
    }, 1000);
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
    setSelectedProduct("");
    setSelectedBillingCompany("");
    setSelectedInvoiceCompany("");
  };

  const hasActiveFilters =
    searchKeyword ||
    selectedCompany ||
    dateRange.start ||
    dateRange.end ||
    priceRange.min ||
    priceRange.max ||
    selectedBillingCompany ||
    selectedInvoiceCompany ||
    selectedProduct;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">读取数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linear-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1
              className="text-xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              发票面板
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={handleDownload}
              disabled={isDownloading || currentData?.length === 0}
              className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 flex items-center gap-2"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {isDownloading ? "下载中..." : "下载表格"}
              </span>
            </Button>
            <Button
              onClick={() => handleUpload()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 border border-violet-500/30 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isUploading ? (
                <span className="hidden sm:inline">上传中...</span>
              ) : selectedFile ? (
                <span className="hidden sm:inline">点击上传</span>
              ) : (
                <span className="hidden sm:inline">上传表格</span>
              )}
            </Button>
            <Button
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">退出</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm mb-1">发票总数</p>
                  <p className="text-3xl font-bold">{stats.totalInvoices}</p>
                </div>
                <FileText className="w-10 h-10 text-cyan-400/30" />
              </div>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm mb-1">总金额</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.totalAmount)}
                  </p>
                </div>
                <JapaneseYen className="w-10 h-10 text-green-400/30" />
              </div>
            </Card>

            {/* <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm mb-1">Average Amount</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.averageAmount)}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-400/30" />
              </div>
            </Card> */}

            <Card
              className="bg-slate-800/50 border-slate-700/50 backdrop-blur p-6 cursor-pointer hover:bg-slate-800/70 transition-all"
              onClick={() => setShowCompanyList(true)}
            >
              {" "}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm mb-1">公司数量</p>
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
                搜索和筛选
              </h2>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 flex items-center gap-2 text-sm"
                >
                  <X className="w-4 h-4" />
                  清除筛选
                </Button>
              )}
            </div>

            <form onSubmit={handleSearch} className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="按发票号码、公司或产品搜索..."
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
                    <span className="hidden sm:inline">搜索</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                // className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 flex items-center gap-2"
                className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 font-semibold px-6 h-12 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">筛选</span>
              </Button>
            </form>

            {/* Advanced Filters */}
            {showFilters && (
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur p-6 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Company Filter */}
                  {/* <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      公司
                    </label>
                    <select
                      value={selectedCompany}
                      onChange={e => setSelectedCompany(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
                    >
                      <option value=""> 所有公司</option>
                      {uniqueCompanies.map(company => (
                        <option key={company} value={company}>
                          {company}
                        </option>
                      ))}
                    </select>
                  </div> */}

                  {/* Billing Company Filter */}
                  {/* <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      收票公司
                    </label>
                    <select
                      value={selectedBillingCompany}
                      onChange={e => setSelectedBillingCompany(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
                    >
                      <option value="">所有收票</option>
                      {uniqueBillingCompanies.map(company => (
                        <option key={company} value={company}>
                          {company}
                        </option>
                      ))}
                    </select>
                  </div> */}

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      收票公司
                    </label>
                    <input
                      list="billing-companies"
                      value={selectedBillingCompany}
                      onChange={e => setSelectedBillingCompany(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
                      placeholder="搜索或输入开票公司..."
                    />
                    <datalist id="billing-companies">
                      <option value="">所有公司</option>
                      {uniqueBillingCompanies.map(company => (
                        <option key={company} value={company}>
                          {company}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  {/* Invoice Company Filter */}
                  {/* <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      开票公司
                    </label>
                    <select
                      value={selectedInvoiceCompany}
                      onChange={e => setSelectedInvoiceCompany(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
                    >
                      <option value="">所有发票</option>
                      {uniqueInvoiceCompanies.map(company => (
                        <option key={company} value={company}>
                          {company}
                        </option>
                      ))}
                    </select>
                  </div> */}

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      开票公司
                    </label>
                    <input
                      list="invoice-companies"
                      value={selectedInvoiceCompany}
                      onChange={e => setSelectedInvoiceCompany(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
                      placeholder="搜索或输入开票公司..."
                    />
                    <datalist id="invoice-companies">
                      <option value="">所有公司</option>
                      {uniqueInvoiceCompanies.map(company => (
                        <option key={company} value={company}>
                          {company}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  {/* Product Filter */}
                  {/* <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      产品名称
                    </label>
                    <select
                      value={selectedProduct}
                      onChange={e => setSelectedProduct(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
                    >
                      <option value="">所有产品</option>
                      {uniqueProducts.map(product => (
                        <option key={product} value={product}>
                          {product}
                        </option>
                      ))}
                    </select>
                  </div> */}

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      产品名称
                    </label>
                    <input
                      list="products"
                      value={selectedProduct}
                      onChange={e => setSelectedProduct(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
                      placeholder="搜索或输入开票公司..."
                    />
                    <datalist id="products">
                      <option value="">所有产品</option>
                      {uniqueProducts.map(product => (
                        <option key={product} value={product}>
                          {product}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  {/* Date Range - Start */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      起始日期
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
                      截止日期
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
          <div className="w-full grid-cols-1 lg:grid-cols-3 gap-6 flex">
            {/* Results List */}
            {/* <div className="lg:col-span-1">
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur h-full">
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4">
                    结果 ({filteredData.length})
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
            </div> */}

            {/* Detail View */}
            {/* <div className="lg:col-span-2">
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
                      <div className="flex items-start gap-4 pb-4 border-b border-slate-700/50">
                        <FileText className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 mb-1">发票号</p>
                          <p className="text-sm font-medium break-all">
                            {selectedItem.发票号}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 pb-4 border-b border-slate-700/50">
                        <Building2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 mb-1">
                            开票公司
                          </p>
                          <p className="text-sm font-medium">
                            {selectedItem.开票公司}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 pb-4 border-b border-slate-700/50">
                        <Building2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 mb-1">
                            收票公司
                          </p>
                          <p className="text-sm font-medium">
                            {selectedItem.收票公司}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 pb-4 border-b border-slate-700/50">
                        <FileText className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 mb-1">时间</p>
                          <p className="text-sm font-medium">
                            {formatDate(selectedItem.时间)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 pb-4 border-b border-slate-700/50">
                        <FileText className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 mb-1">
                            产品名称
                          </p>
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

                      <div className="flex items-start gap-4 pb-4 border-b border-slate-700/50">
                        <FileText className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 mb-1">数量</p>
                          <p className="text-sm font-medium">
                            {selectedItem.数量}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                        <JapaneseYen className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 mb-1">
                            含税总价
                          </p>
                          <p className="text-lg font-bold text-cyan-400">
                            {formatCurrency(selectedItem.含税总价)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-8 pt-6 border-t border-slate-700/50">
                      <Button className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold">
                        下载
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur h-full flex items-center justify-center min-h-96">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-2">未选择任何发票</p>
                    <p className="text-slate-500 text-sm">
                      搜索发票，点击搜索结果查看详情
                    </p>
                  </div>
                </Card>
              )}
            </div> */}

            {/* Detail View */}
            <div className="w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              {/* 发票表格 */}
              <table className="w-full text-sm text-left text-slate-700 dark:text-slate-200">
                <thead className="w-full text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th scope="col" className="px-4 py-3 rounded-tl-lg">
                      发票号
                    </th>
                    <th scope="col" className="px-4 py-3">
                      开票公司
                    </th>
                    <th scope="col" className="px-4 py-3">
                      收票公司
                    </th>
                    <th scope="col" className="px-4 py-3">
                      开票时间
                    </th>
                    <th scope="col" className="px-4 py-3">
                      产品名称
                    </th>
                    {/* <th scope="col" className="px-4 py-3">
                      规格
                    </th>
                    <th scope="col" className="px-4 py-3">
                      数量
                    </th> */}
                    <th scope="col" className="px-4 py-3 rounded-tr-lg">
                      含税总价(元)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((item, index) => (
                      <tr
                        key={index}
                        className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">{item.发票号}</td>
                        <td className="px-4 py-3 max-w-50 wrap-break-word">
                          {item.开票公司}
                        </td>
                        <td className="px-4 py-3 max-w-50 wrap-break-word">
                          {item.收票公司}
                        </td>
                        <td className="px-4 py-3">{item.时间}</td>
                        <td className="px-4 py-3 max-w-62.5 wrap-break-word">
                          {item.产品名称}
                        </td>
                        {/* <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {item.默认规格 ?? "-"}
                        </td>
                        <td className="px-4 py-3">{item.数量}</td> */}
                        <td className="px-4 py-3 font-semibold text-cyan-600 dark:text-cyan-400">
                          {item.含税总价.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-b-lg"
                      >
                        暂无发票数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* 分页控件 */}
              {totalPages > 0 && (
                <div className="flex items-center justify-center gap-2 py-4 bg-slate-50 dark:bg-slate-800 rounded-b-lg">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-md text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-900 transition-colors"
                  >
                    首页
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-md text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-900 transition-colors"
                  >
                    上一页
                  </button>

                  <span className="text-sm text-slate-600 dark:text-slate-300 px-2">
                    第 {currentPage} 页 / 共 {totalPages} 页
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-md text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-900 transition-colors"
                  >
                    下一页
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-md text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-900 transition-colors"
                  >
                    尾页
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Company List Modal */}
      {showCompanyList && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl max-h-96 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h3
                className="text-xl font-bold"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                公司数量 ({uniqueFilteredCompanies.length})
              </h3>
              <Button
                onClick={() => setShowCompanyList(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white p-2 h-auto"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {uniqueFilteredCompanies.length === 0 ? (
                <p className="text-slate-400 text-center py-8">未找到公司</p>
              ) : (
                <div className="space-y-2">
                  {uniqueFilteredCompanies.map(company => (
                    <div
                      key={company}
                      className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 hover:bg-slate-700 transition-all"
                    >
                      {company}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
