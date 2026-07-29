export interface RulesItem {
  id: number;
  name?: string | null;
  code?: string | null;
  statement?: string | null;
  requestAmout?: number;
}

export interface CreateRulesBody {
  name: string;
  code: string;
  statement?: string;
  requestAmout?: number;
}

export interface EditRulesBody extends CreateRulesBody {
  id: number;
}

export interface GetAllRulesParams {
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}
