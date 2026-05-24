import { useState } from "react";
import {
  type LoaiDaoTao,
  type LookupSearchInput,
  type StudentLookupPublic,
  lookupSearchInputSchema,
} from "shared";
import { StudentCard } from "../components/StudentCard";
import { trpcClient } from "../lib/trpc";

type LookupSearch = (input: LookupSearchInput) => Promise<StudentLookupPublic[]>;

type LookupState =
  | {
      status: "idle";
    }
  | {
      loaiDaoTao: LoaiDaoTao;
      status: "loading";
    }
  | {
      message: string;
      status: "error";
    }
  | {
      status: "empty";
    }
  | {
      results: StudentLookupPublic[];
      status: "success";
    };

export type LookupPageProps = {
  searchStudent?: LookupSearch;
};

const defaultSearchStudent: LookupSearch = (input) =>
  trpcClient.lookup.searchStudent.query(input);

export function sanitizeSoCMT(value: string) {
  return value.replace(/\D/g, "").slice(0, 12);
}

export async function runLookupSearch({
  loaiDaoTao,
  searchStudent,
  soCMT,
}: {
  loaiDaoTao: LoaiDaoTao;
  searchStudent: LookupSearch;
  soCMT: string;
}): Promise<LookupState> {
  const parsedInput = lookupSearchInputSchema.safeParse({
    loaiDaoTao,
    soCMT: soCMT.trim(),
  });

  if (!parsedInput.success) {
    return {
      message: "Vui lòng nhập CCCD gồm 9-12 chữ số.",
      status: "error",
    };
  }

  try {
    const results = await searchStudent(parsedInput.data);

    if (results.length === 0) {
      return {
        status: "empty",
      };
    }

    return {
      results,
      status: "success",
    };
  } catch {
    return {
      message: "Không thể tra cứu lúc này. Vui lòng thử lại sau.",
      status: "error",
    };
  }
}

function formatLoaiDaoTao(value: LoaiDaoTao) {
  return value === "moto" ? "Mô tô" : "Ô tô";
}

export function LookupResultList({ state }: { state: LookupState }) {
  if (state.status === "idle") {
    return (
      <p className="lookup-helper">
        Hệ thống chỉ hiển thị CCCD đã che trong kết quả tra cứu.
      </p>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="lookup-status lookup-status--loading" role="status">
        Đang tra cứu hồ sơ {formatLoaiDaoTao(state.loaiDaoTao)}...
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="lookup-status lookup-status--error" role="alert">
        {state.message}
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <div className="lookup-status" role="status">
        Không tìm thấy hồ sơ phù hợp.
      </div>
    );
  }

  return (
    <div className="lookup-results" aria-label="Kết quả tra cứu học viên">
      {state.results.map((student, index) => (
        <StudentCard
          key={`${student.soCMTMasked}-${student.tenKhoaHoc ?? "khoa"}-${index}`}
          student={student}
        />
      ))}
    </div>
  );
}

export function LookupPage({ searchStudent = defaultSearchStudent }: LookupPageProps) {
  const [soCMT, setSoCMT] = useState("");
  const [lookupState, setLookupState] = useState<LookupState>({
    status: "idle",
  });

  async function handleSearch(loaiDaoTao: LoaiDaoTao) {
    const sanitizedSoCMT = sanitizeSoCMT(soCMT);

    setSoCMT(sanitizedSoCMT);

    const parsedInput = lookupSearchInputSchema.safeParse({
      loaiDaoTao,
      soCMT: sanitizedSoCMT,
    });

    if (!parsedInput.success) {
      setLookupState({
        message: "Vui lòng nhập CCCD gồm 9-12 chữ số.",
        status: "error",
      });
      return;
    }

    setLookupState({
      loaiDaoTao,
      status: "loading",
    });

    const nextState = await runLookupSearch({
      loaiDaoTao,
      searchStudent,
      soCMT: sanitizedSoCMT,
    });

    setLookupState(nextState);
  }

  return (
    <section className="page-section" id="tra-cuu" aria-labelledby="lookup-title">
      <div className="section-heading">
        <p className="section-eyebrow">Tra cứu học viên</p>
        <h2 id="lookup-title">Khu vực tra cứu thông tin đăng ký học</h2>
        <p>
          Nhập CCCD và chọn loại đào tạo để tra cứu thông tin đăng ký học.
          Kết quả chỉ hiển thị CCCD đã che từ hệ thống.
        </p>
      </div>

      <form className="lookup-form" onSubmit={(event) => event.preventDefault()}>
        <div className="lookup-field">
          <label htmlFor="lookup-so-cmt">CCCD</label>
          <input
            autoComplete="off"
            id="lookup-so-cmt"
            inputMode="numeric"
            maxLength={12}
            onChange={(event) => setSoCMT(sanitizeSoCMT(event.target.value))}
            pattern="[0-9]*"
            placeholder="Nhập 9-12 chữ số"
            type="text"
            value={soCMT}
          />
        </div>

        <div className="lookup-actions" aria-label="Chọn loại đào tạo để tra cứu">
          <button
            className="button-link button-link--primary"
            disabled={lookupState.status === "loading"}
            onClick={() => void handleSearch("moto")}
            type="button"
          >
            Tra cứu Mô tô
          </button>
          <button
            className="button-link"
            disabled={lookupState.status === "loading"}
            onClick={() => void handleSearch("oto")}
            type="button"
          >
            Tra cứu Ô tô
          </button>
        </div>
      </form>

      <LookupResultList state={lookupState} />
    </section>
  );
}
